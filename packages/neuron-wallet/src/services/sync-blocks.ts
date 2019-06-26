import { getConnection } from 'typeorm'
import { remote } from 'electron'
import { Subject, BehaviorSubject } from 'rxjs'
import Core from '@nervosnetwork/ckb-sdk-core'
import { Script, OutPoint, Cell, Input, Transaction, Block, BlockHeader } from '../types/cell-types'
import TransactionsService from './transactions'
import OutputEntity from '../database/chain/entities/output'
import SyncInfoEntity from '../database/chain/entities/sync-info'
import NodeService from './node'
import LockUtils from '../utils/lock-utils'
import TypeConvert from '../types/type-convert'
import { NetworkWithID } from './networks'
import AddressesUsedSubject from '../models/subjects/addresses-used-subject'

const { app }: { app: any } = remote
const { syncBlockTask } = app
const { networkSwitchSubject } = syncBlockTask

// FIXME: now have some problem with core, should update every time network switched
// const { core } = NodeService.getInstance()
let core: Core
networkSwitchSubject.subscribe((network: NetworkWithID | undefined) => {
  if (network) {
    core = new Core(network.remote)
  }
})

/* eslint no-await-in-loop: "off" */
/* eslint no-restricted-syntax: "warn" */
export default class SyncBlocksService {
  private lockHashList: string[]
  private fetchSize = 128
  private minFetchSize = 16
  // TODO: it should depends on CKB
  private sizeForCheck = 12
  private tryTime = 0
  private stopFlag = false
  private loopFlag = false

  // cache the blocks for check fork
  private blockHeadersForCheck: BlockHeader[] = []

  private currentBlockNumberValue: number | undefined = undefined

  private tipBlockNumber: number = -1

  private addressesUsedSubject: Subject<string[]>

  constructor(
    lockHashes: string[],
    tipNumberSubject: BehaviorSubject<string | undefined> = NodeService.getInstance().tipNumberSubject,
    addressesUsedSubject: Subject<string[]> = AddressesUsedSubject.subject
  ) {
    this.lockHashList = lockHashes
    this.addressesUsedSubject = addressesUsedSubject
    // listen for tipNumber changes
    tipNumberSubject.subscribe(async num => {
      if (num) {
        this.tipBlockNumber = parseInt(num, 10)
        if (this.loopFlag === true && this.stopped()) {
          await this.loopBlocks()
        }
      }
    })
  }

  get lockHashes(): string[] {
    return this.lockHashList
  }

  set lockHashes(lockHashes: string[]) {
    this.lockHashList = lockHashes
  }

  // continue to loop blocks, follow chain height
  async loopBlocks() {
    this.loopFlag = true
    this.stopFlag = false
    if (this.tipBlockNumber < 0) {
      this.stopFlag = true
      return
    }
    await this.initBlockHeadersForCheck()
    while (!this.stopFlag) {
      await this.resolveBatchBlocks()
    }
  }

  // stop loop
  stop() {
    this.loopFlag = false
    this.stopFlag = true
  }

  stopped() {
    return this.stopFlag
  }

  async initBlockHeadersForCheck(): Promise<void> {
    const currentBlockNumber: number = await this.currentBlockNumber()
    if (currentBlockNumber <= 0) {
      return
    }
    const startBlockNumber: number = currentBlockNumber - this.sizeForCheck
    const realStartBlockNumber: number = startBlockNumber > 0 ? startBlockNumber : 0
    const blocks: Block[] = await SyncBlocksService.getBlockByNumber(realStartBlockNumber, this.sizeForCheck)
    this.blockHeadersForCheck = blocks.map(block => block.header)
  }

  updateBlockHeadersForCheck(blocks: Block[]) {
    const start: number = blocks.length - this.sizeForCheck
    const realStart: number = start > 0 ? start : 0
    this.blockHeadersForCheck = blocks.slice(realStart, blocks.length).map(block => block.header)
  }

  // resolve block to
  async resolveBatchBlocks() {
    if (this.tipBlockNumber < 0) {
      return
    }
    // using database to sync currentBlockNumber value
    // currentBlockNumber means last checked blockNumber
    // so should start with currentBlockNumber + 1
    const currentBlockNumber: number = await this.currentBlockNumber()
    const blocks: Block[] = await this.tryGetBlocksByNumber(currentBlockNumber + 1)
    if (blocks.length <= 0) {
      return
    }
    const blockHeaders: BlockHeader[] = blocks.map(block => block.header)
    const checkResult = this.checkBlockRange(blockHeaders)
    let blocksToSave: Block[] = []
    if (checkResult.success !== true) {
      // this type means blockHeadersForCheck has an error
      if (checkResult.type! === 'blockHeadersForCheckError') {
        const firstCheckNumber = this.blockHeadersForCheck[0].number
        await this.deleteTxs(firstCheckNumber)
        // reset currentBlockNumber
        this.updateCurrentBlockNumber(parseInt(firstCheckNumber, 10) - 1)
        // re init blockHeadersForCheck, should reset currentBlockNumber before
        await this.initBlockHeadersForCheck()
        blocksToSave = []
      } else {
        // reset blocks range to save, and reset currentBlockNumber
        blocksToSave = blocks.slice(0, checkResult.index!)
        await this.updateCurrentBlockNumber(parseInt(checkResult.blockHeader!.number, 10))
      }
    } else {
      blocksToSave = blocks
    }

    this.updateBlockHeadersForCheck(blocksToSave)
    await this.resolveBlocks(blocksToSave)
  }

  // delete all transactions where blockNumber >= checkResult.blockHeader!.number
  async deleteTxs(sinceBlockNumber: string) {
    const blockNumbers: number[] = Array.from({ length: this.sizeForCheck + 2 }).map(
      (_a, i) => i + parseInt(sinceBlockNumber, 10)
    )
    await TransactionsService.deleteByBlockNumbers(blockNumbers.map(n => n.toString()))
  }

  clearTryTime() {
    this.tryTime = 0
  }

  // reduce fetchSize to half if try three times in a row
  checkTryTime() {
    this.tryTime += 1
    if (this.tryTime >= 3) {
      this.clearTryTime()
      const halfFetchSize = parseInt((this.fetchSize / 2).toString(), 10)
      this.fetchSize = Math.max(halfFetchSize, this.minFetchSize)
    }
  }

  async tryGetBlocksByNumber(startBlockNumber: number): Promise<Block[]> {
    // return if stopped
    if (this.stopped()) {
      return []
    }

    // startBlockNumber should >= 0 && startBlockNumber should >= tipBlockNumber
    if (startBlockNumber < 0 || this.tipBlockNumber < startBlockNumber) {
      return []
    }

    // size for fetch
    const size: number = Math.min(this.tipBlockNumber - startBlockNumber + 1, this.fetchSize)

    let blocks: Block[] = []
    try {
      // TODO: check RPC error info
      blocks = await SyncBlocksService.getBlockByNumber(startBlockNumber, size)
    } catch (err) {
      console.error(err)
      this.checkTryTime()
      return this.tryGetBlocksByNumber(startBlockNumber)
    }

    // clearTryTime if success
    this.clearTryTime()

    const endBlockNumber: number = startBlockNumber + size - 1
    // update current block number here
    await this.updateCurrentBlockNumber(endBlockNumber)
    return blocks
  }

  static async getBlockByNumber(startBlockNumber: number, size: number): Promise<Block[]> {
    const blockNumbers = Array.from({ length: size }).map((_a, i) => i + startBlockNumber)
    const blocks: Block[] = await Promise.all(
      blockNumbers.map(async num => {
        const block = await core.rpc.getBlockByNumber(num.toString())
        return TypeConvert.toBlock(block)
      })
    )
    return blocks
  }

  checkBlockRange(
    blockHeaders: BlockHeader[]
  ): {
    success: boolean
    index?: number
    blockHeader?: BlockHeader
    type?: string
  } {
    if (this.blockHeadersForCheck.length > 0) {
      const lastBlockHeaderForCheck: BlockHeader = this.blockHeadersForCheck[this.blockHeadersForCheck.length - 1]
      const firstBlockHeader = blockHeaders[0]
      if (firstBlockHeader.parentHash !== lastBlockHeaderForCheck.hash) {
        return {
          success: false,
          type: 'blockHeadersForCheckError',
        }
      }
    }

    // we can use such as 5 blocks to check parent hash
    // the first time we get blocks whose block number in 0-100
    // next time we get blocks whose block number in 96 - 200
    // and third time we get blocks whose block number in 196-300 and so on ...
    // if 96 is a wrong block, it should replace in 1-100
    // so when we get 96 in 96-200, it a block in best blockchain
    // so we can trust 96, and check range based on 96
    for (let i = 1; i < blockHeaders.length; ++i) {
      const currentBlockHeader = blockHeaders[i]
      const previousBlockHeader = blockHeaders[i - 1]
      if (currentBlockHeader.parentHash !== previousBlockHeader.hash) {
        return {
          success: false,
          type: 'blockHeadersError',
          index: i,
          blockHeader: currentBlockHeader,
        }
      }
    }
    return {
      success: true,
    }
  }

  // TODO: handle this error, may need transaction
  async resolveBlocks(blocks: Block[]) {
    await Promise.all(
      blocks.map(async block => {
        await this.resolveBlock(block)
      })
    )
  }

  // resolve block
  async resolveBlock(block: Block) {
    const { transactions } = block
    this.resolveTxs(transactions)
  }

  // resolve transactions
  async resolveTxs(transactions: Transaction[]) {
    for (const tx of transactions) {
      await this.resolveTx(tx)
    }
  }

  // resolve single transaction
  async resolveTx(transaction: Transaction) {
    const outputs: Cell[] = this.filterOutputs(transaction.outputs!)
    const anyInput: boolean = await SyncBlocksService.anyInput(transaction.inputs!)

    if (outputs.length > 0) {
      // found addresses used
      const addresses: string[] = outputs.map(output => {
        return LockUtils.lockScriptToAddress(output.lock)
      })
      this.addressesUsedSubject.next(addresses)
    }

    if (outputs.length > 0 || anyInput) {
      // save fetched transactions
      await TransactionsService.saveFetchTx(transaction)
    }
  }

  filterOutputs(outputs: Cell[]): Cell[] {
    return outputs.filter(output => {
      return this.checkLockScript(output.lock!)
    })
  }

  public static async anyInput(inputs: Input[]): Promise<boolean> {
    for (const input of inputs) {
      const outPoint: OutPoint = input.previousOutput
      const { cell } = outPoint
      if (!cell) {
        break
      }
      const output = await getConnection()
        .getRepository(OutputEntity)
        .findOne({
          outPointTxHash: cell.txHash,
          outPointIndex: cell.index,
        })
      if (output) {
        return true
      }
    }

    return false
  }

  checkLockScript(lock: Script): boolean {
    const lockHash = LockUtils.lockScriptToHash(lock)
    return this.checkLockHash(lockHash)
  }

  // is this lockHash belongs to me
  checkLockHash(lockHash: string): boolean {
    return this.lockHashList.includes(lockHash)
  }

  // get SyncInfo name = 'currentBlockNumber'
  async currentBlockNumber(): Promise<number> {
    if (this.currentBlockNumberValue) {
      return this.currentBlockNumberValue
    }
    const blockNumber: SyncInfoEntity | undefined = await getConnection()
      .getRepository(SyncInfoEntity)
      .findOne({
        name: SyncInfoEntity.CURRENT_BLOCK_NUMBER,
      })
    if (!blockNumber) {
      return 0
    }
    return parseInt(blockNumber.value, 10)
  }

  async updateCurrentBlockNumber(currentBlockNumber: number): Promise<void> {
    let current: SyncInfoEntity | undefined = await getConnection()
      .getRepository(SyncInfoEntity)
      .findOne({
        name: SyncInfoEntity.CURRENT_BLOCK_NUMBER,
      })
    if (!current) {
      current = new SyncInfoEntity()
      current.name = SyncInfoEntity.CURRENT_BLOCK_NUMBER
    }
    current.value = currentBlockNumber.toString()
    await getConnection().manager.save(current)
    this.currentBlockNumberValue = currentBlockNumber
  }
}

import { getConnection } from 'typeorm'
import { Script, OutPoint, Cell } from './cells'
import TransactionsService, { Input, Transaction } from './transactions'
import OutputEntity from '../entities/Output'
import ckbCore from '../core'
import SyncInfoEntity from '../entities/SyncInfo'

export interface BlockHeader {
  version: number
  timestamp: string
  hash: string
  parentHash: string
  number: string
}

export interface Block {
  header: BlockHeader
  transactions: Transaction[]
}

/* eslint no-await-in-loop: "off" */
/* eslint no-restricted-syntax: "warn" */
export default class SyncBlocksService {
  private lockHashList: string[]

  private fetchSize = 128

  private minFetchSize = 2

  private sizeForCheck = 5

  private tryHashesTime = 0

  private tryBlocksTime = 0

  constructor(lockHashes: string[]) {
    this.lockHashList = lockHashes
  }

  get lockHashes(): string[] {
    return this.lockHashList
  }

  set lockHashes(lockHashes: string[]) {
    this.lockHashList = lockHashes
  }

  // continue to loop blocks, follow chain height
  async loopBlocks() {
    const flag = true
    while (flag) {
      await this.resolveBatchBlocks()
    }
  }

  // resolve block to
  async resolveBatchBlocks() {
    // using database to sync currentBlockNumber value
    const currentBlockNumber = await SyncBlocksService.currentBlockNumber()
    const [blockHashes, checkSize] = await this.tryGetBlockHashes(currentBlockNumber)
    const blocks: Block[] = await this.tryGetBlocks(blockHashes)
    const checkResult = SyncBlocksService.checkBlockRange(blocks.map(block => block.header))
    let blocksToSave: Block[] = []
    if (checkResult.success !== true) {
      if (checkResult.index! < checkSize) {
        // result blocks range to save, and delete all transactions where blockNumber >= checkResult.blockHeader!.number
        // TODO: delete all transactions where blockNumber >= checkResult.blockHeader!.number
        blocksToSave = blocks.slice(checkResult.index!, blocks.length)
      } else {
        // reset blocks range to save, and reset currentBlockNumber
        blocksToSave = blocks.slice(checkSize, checkResult.index!)
        await SyncBlocksService.updateCurrentBlockNumber(parseInt(checkResult.blockHeader!.number, 10))
      }
    } else {
      blocksToSave = blocks.slice(checkSize, blocks.length)
    }
    await this.resolveBlocks(blocksToSave)
  }

  async tryGetTipBlockNumber(): Promise<number> {
    try {
      const tipBlockNumber = await ckbCore.rpc.getTipBlockNumber()
      return tipBlockNumber
    } catch {
      return this.tryGetTipBlockNumber()
    }
  }

  async tryGetBlockHashes(startBlockNumber: number): Promise<[string[], number]> {
    const tipBlockNumber = await this.tryGetTipBlockNumber()
    // startBlockNumber should >= tipBlockNumber
    if (tipBlockNumber < startBlockNumber) {
      return [[], 0]
    }
    const size: number = tipBlockNumber - startBlockNumber
    const realSize: number = Math.min(size, this.fetchSize)
    const realStartBlockNumber = Math.max(startBlockNumber - this.sizeForCheck, 0)

    let blockHashes: string[] = []
    try {
      // TODO: check RPC error info
      blockHashes = await SyncBlocksService.getBlockHashes(realStartBlockNumber, realSize)
    } catch {
      // TODO: should only catch RPC error
      this.tryHashesTime += 1
      if (this.tryHashesTime >= 3) {
        this.tryHashesTime = 0
        const halfFetchSize = parseInt((this.fetchSize / 2).toString(), 10)
        this.fetchSize = Math.max(halfFetchSize, this.minFetchSize)
      }
      return this.tryGetBlockHashes(startBlockNumber)
    }

    const realCheckSize = startBlockNumber - realStartBlockNumber
    const endBlockNumber = realStartBlockNumber + realSize - 1
    // update current block number here
    await SyncBlocksService.updateCurrentBlockNumber(endBlockNumber)
    return [blockHashes, realCheckSize]
  }

  // return blocks should exclude check blocks
  async tryGetBlocks(blockHashes: string[]): Promise<Block[]> {
    try {
      const blocks: Block[] = await SyncBlocksService.getBlocks(blockHashes)
      return blocks
    } catch {
      this.tryBlocksTime += 1
      if (this.tryBlocksTime >= 3) {
        this.tryBlocksTime = 0
        const halfFetchSize = parseInt((this.fetchSize / 2).toString(), 10)
        this.fetchSize = Math.max(halfFetchSize, this.minFetchSize)
      }
      return this.tryGetBlocks(blockHashes)
    }
  }

  static async getBlockHashes(startBlockNumber: number, size: number): Promise<string[]> {
    const blockNumbers = Array.from({ length: size }).map((_a, i) => i + startBlockNumber)
    const blockHashes: string[] = await Promise.all(
      blockNumbers.map(async num => {
        const hash: string = await ckbCore.rpc.getBlockHash(num)
        return hash
      }),
    )
    return blockHashes
  }

  static async getBlocks(blockHashes: string[]): Promise<Block[]> {
    const blocks = await Promise.all(
      blockHashes.map(async hash => {
        const block = await ckbCore.rpc.getBlock(hash)
        return SyncBlocksService.convertBlock(block)
      }),
    )
    return blocks
  }

  static checkBlockRange(
    blockHeaders: BlockHeader[],
  ): {
    success: boolean
    index?: number
    blockHeader?: BlockHeader
  } {
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
      }),
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
    const anyOutput: boolean = this.anyOutput(transaction.outputs!)
    const anyInput: boolean = await SyncBlocksService.anyInput(transaction.inputs!)
    if (anyOutput || anyInput) {
      TransactionsService.saveFetchTx(transaction)
    }
  }

  anyOutput(outputs: Cell[]): boolean {
    return !!outputs.find(output => {
      return this.checkLockScript(output.lock!)
    })
  }

  public static async anyInput(inputs: Input[]): Promise<boolean> {
    for (const input of inputs) {
      const outPoint: OutPoint = input.previousOutput
      const output = await getConnection()
        .getRepository(OutputEntity)
        .findOne({
          outPointHash: outPoint.hash,
          outPointIndex: outPoint.index,
        })
      if (output) {
        return true
      }
    }

    return false
  }

  checkLockScript(lock: Script): boolean {
    const lockHash = TransactionsService.lockScriptToHash(lock)
    return this.checkLockHash(lockHash)
  }

  // is this lockHash belongs to me
  checkLockHash(lockHash: string): boolean {
    return this.lockHashList.includes(lockHash)
  }

  // get SyncInfo name = 'currentBlockNumber'
  static async currentBlockNumber(): Promise<number> {
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

  static async updateCurrentBlockNumber(currentBlockNumber: number): Promise<void> {
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
  }

  static convertBlock(block: CKBComponents.Block): Block {
    const blockHeader = SyncBlocksService.convertBlockHeader(block.header)
    return {
      header: blockHeader,
      transactions: block.commitTransactions.map(tx => SyncBlocksService.convertTransaction(tx, blockHeader)),
    }
  }

  static convertBlockHeader(blockHeader: CKBComponents.BlockHeader): BlockHeader {
    return {
      version: blockHeader.version,
      timestamp: blockHeader.timestamp.toString(),
      hash: blockHeader.hash,
      parentHash: blockHeader.parentHash,
      number: blockHeader.number.toString(),
    }
  }

  static convertTransaction(transaction: CKBComponents.Transaction, blockHeader?: BlockHeader): Transaction {
    const tx: Transaction = {
      hash: transaction.hash,
      version: transaction.version,
      deps: transaction.deps,
      witnesses: transaction.witnesses,
      inputs: transaction.inputs.map(SyncBlocksService.convertInput),
      outputs: transaction.outputs.map(SyncBlocksService.convertOutput),
    }
    if (blockHeader) {
      tx.timestamp = blockHeader.timestamp
      tx.blockNumber = blockHeader.number
      tx.blockHash = blockHeader.hash
    }
    return tx
  }

  // FIXME: input of SDK return not compatible with CKBComponents.CellInput
  static convertInput(input: any): Input {
    return {
      previousOutput: input.previous_output,
      args: input.args.map((arg: Uint8Array) => ckbCore.utils.bytesToHex(arg)),
    }
  }

  static convertOutPoint(outPoint: CKBComponents.OutPoint): OutPoint {
    return {
      hash: outPoint.hash,
      index: outPoint.index,
    }
  }

  static convertOutput(output: CKBComponents.CellOutput): Cell {
    return {
      capacity: output.capacity.toString(),
      data: ckbCore.utils.bytesToHex(output.data),
      lock: SyncBlocksService.convertScript(output.lock),
    }
  }

  // FIXME: lock script of SDK return not compatible with CKBComponents.Script
  static convertScript(script: any): Script {
    return {
      args: script.args.map((arg: Uint8Array) => ckbCore.utils.bytesToHex(arg)),
      binaryHash: script.binary_hash,
    }
  }
}

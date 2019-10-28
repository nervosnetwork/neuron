import Core from '@nervosnetwork/ckb-sdk-core'
import { generateCore } from 'services/sdk-core'

import { Block, BlockHeader } from 'types/cell-types'
import TypeConvert from 'types/type-convert'
import Utils from './utils'
import HexUtils from 'utils/hex'
import CheckTx from 'services/sync/check-and-save/tx'
import { TransactionPersistor } from 'services/tx'
import LockUtils from 'models/lock-utils'
import { addressesUsedSubject } from './renderer-params'
import logger from 'utils/logger'

export default class GetBlocks {
  private retryTime: number
  private retryInterval: number
  private core: Core
  private url: string

  constructor(url: string, retryTime: number = 3, retryInterval: number = 100) {
    this.retryTime = retryTime
    this.retryInterval = retryInterval
    this.url = url
    this.core = generateCore(url)
  }

  public getRangeBlocks = async (blockNumbers: string[]): Promise<Block[]> => {
    const blocks: Block[] = await Promise.all(
      blockNumbers.map(async num => {
        return this.retryGetBlock(num)
      })
    )

    return blocks
  }

  public getTipBlockNumber = async (): Promise<string> => {
    return this.core.rpc.getTipBlockNumber()
  }

  public checkAndSave = async (blocks: Block[], lockHashes: string[]): Promise<void> => {
    const cachedPreviousTxs = new Map()
    for (const block of blocks) {
      logger.debug(`checking block #${block.header.number}, ${block.transactions.length} txs`)
      for (const tx of block.transactions) {
        const checkTx = new CheckTx(tx, this.url)
        const addresses = await checkTx.check(lockHashes)
        if (addresses.length > 0) {
          for (const input of tx.inputs!) {
            const previousTxHash = input.previousOutput!.txHash
            let previousTxWithStatus = cachedPreviousTxs.get(previousTxHash)
            if (!previousTxWithStatus) {
              previousTxWithStatus = await this.getTransaction(previousTxHash)
              cachedPreviousTxs.set(previousTxHash, previousTxWithStatus)
            }
            const previousTx = TypeConvert.toTransaction(previousTxWithStatus.transaction)
            const previousOutput = previousTx.outputs![+input.previousOutput!.index]
            input.lock = previousOutput.lock
            input.lockHash = LockUtils.lockScriptToHash(input.lock)
            input.capacity = previousOutput.capacity
          }
          await TransactionPersistor.saveFetchTx(tx)
          addressesUsedSubject.next({
            addresses,
            url: this.url,
          })
        }
      }
    }
    cachedPreviousTxs.clear()
  }

  public retryGetBlock = async (num: string): Promise<Block> => {
    const block: Block = await Utils.retry(this.retryTime, this.retryInterval, async () => {
      return await this.getBlockByNumber(num)
    })

    return block
  }

  public getTransaction = async (hash: string): Promise<CKBComponents.TransactionWithStatus> => {
    return await this.core.rpc.getTransaction(hash)
  }

  public getHeader = async (hash: string): Promise<BlockHeader> => {
    const result = await this.core.rpc.getHeader(hash)
    return TypeConvert.toBlockHeader(result)
  }

  public getBlockByNumber = async (num: string): Promise<Block> => {
    const block = await this.core.rpc.getBlockByNumber(HexUtils.toHex(num))
    return TypeConvert.toBlock(block)
  }

  public genesisBlockHash = async (): Promise<string> => {
    const hash: string = await Utils.retry(3, 100, async () => {
      return await this.core.rpc.getBlockHash('0x0')
    })

    return hash
  }
}

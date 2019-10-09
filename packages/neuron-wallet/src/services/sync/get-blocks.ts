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

export default class GetBlocks {
  private retryTime: number
  private retryInterval: number
  private core: Core

  constructor(url: string, retryTime: number = 3, retryInterval: number = 100) {
    this.retryTime = retryTime
    this.retryInterval = retryInterval
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
    const tip: string = await this.core.rpc.getTipBlockNumber()
    return tip
  }

  public checkAndSave = async (blocks: Block[], lockHashes: string[]): Promise<void> => {
    for (const block of blocks) {
      for (const tx of block.transactions) {
        const checkTx = new CheckTx(tx)
        const addresses = await checkTx.check(lockHashes)
        if (addresses.length > 0) {
          for (const input of tx.inputs!) {
            const previousTxWithStatus = await this.getTransaction(input.previousOutput!.txHash)
            const previousTx = TypeConvert.toTransaction(previousTxWithStatus.transaction)
            const previousOutput = previousTx.outputs![+input.previousOutput!.index]
            input.lock = previousOutput.lock
            input.lockHash = LockUtils.lockScriptToHash(input.lock)
            input.capacity = previousOutput.capacity
          }
          await TransactionPersistor.saveFetchTx(tx)
          addressesUsedSubject.next(addresses)
        }
      }
    }
  }

  public retryGetBlock = async (num: string): Promise<Block> => {
    const block: Block = await Utils.retry(this.retryTime, this.retryInterval, async () => {
      const b: Block = await this.getBlockByNumber(num)
      return b
    })

    return block
  }

  public getTransaction = async (hash: string): Promise<CKBComponents.TransactionWithStatus> => {
    const tx = await this.core.rpc.getTransaction(hash)
    return tx
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
      const h: string = await this.core.rpc.getBlockHash('0x0')
      return h
    })

    return hash
  }
}

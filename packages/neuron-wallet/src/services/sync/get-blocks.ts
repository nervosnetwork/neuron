import Core from '@nervosnetwork/ckb-sdk-core'
import { generateCore } from 'services/sdk-core'

import { Block, BlockHeader } from 'types/cell-types'
import TypeConvert from 'types/type-convert'
import Utils from './utils'
import HexUtils from 'utils/hex'
import CheckTx from 'services/sync/check-and-save/tx'
import { TransactionPersistor } from 'services/tx'
import LockUtils from 'models/lock-utils'
import logger from 'utils/logger'
import AddressesUsedSubject from 'models/subjects/addresses-used-subject'

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

  public getRangeBlockHeaders = async (blockNumbers: string[]): Promise<BlockHeader[]> => {
    const headers: BlockHeader[] = await Promise.all(
      blockNumbers.map(async num => {
        return this.retryGetBlockHeader(num)
      })
    )

    return headers
  }

  public getTipBlockNumber = async (): Promise<string> => {
    return this.core.rpc.getTipBlockNumber()
  }

  public checkAndSave = async (blocks: Block[], lockHashes: string[], daoScriptHash: string): Promise<void> => {
    const cachedPreviousTxs = new Map()
    for (const block of blocks) {
      if (BigInt(block.header.number) % 1000n === 0n) {
        logger.debug(`Scanning from block #${block.header.number}`)
      }
      for (let i = 0; i < block.transactions.length; ++i) {
        const tx = block.transactions[i]
        const checkTx = new CheckTx(tx, this.url, daoScriptHash)
        const addresses = await checkTx.check(lockHashes)
        if (addresses.length > 0) {
          if (i > 0) {
            for (const [inputIndex, input] of tx.inputs!.entries()) {
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
              input.inputIndex = inputIndex.toString()

              if (
                previousOutput.type &&
                LockUtils.computeScriptHash(previousOutput.type) === daoScriptHash &&
                previousTx.outputsData![+input.previousOutput!.index] === '0x0000000000000000'
              ) {
                const output = tx.outputs![inputIndex]
                if (output) {
                  output.depositOutPoint = {
                    txHash: input.previousOutput!.txHash,
                    index: input.previousOutput!.index,
                  }
                }
              }
            }
          }
          await TransactionPersistor.saveFetchTx(tx)
          AddressesUsedSubject.getSubject().next({
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

  public retryGetBlockHeader = async (num: string): Promise<BlockHeader> => {
    const header: BlockHeader = await Utils.retry(this.retryTime, this.retryInterval, async () => {
      return await this.getBlockHeaderByNumber(num)
    })

    return header
  }

  public getTransaction = async (hash: string): Promise<CKBComponents.TransactionWithStatus> => {
    return await this.core.rpc.getTransaction(hash)
  }

  public getHeader = async (hash: string): Promise<BlockHeader | undefined> => {
    const result = await this.core.rpc.getHeader(hash)
    if (result) {
      return TypeConvert.toBlockHeader(result)
    }
    return undefined
  }

  public getBlockByNumber = async (num: string): Promise<Block> => {
    const block = await this.core.rpc.getBlockByNumber(HexUtils.toHex(num))
    return TypeConvert.toBlock(block)
  }

  public getBlockHeaderByNumber = async (num: string): Promise<BlockHeader> => {
    const header = await this.core.rpc.getHeaderByNumber(HexUtils.toHex(num))
    return TypeConvert.toBlockHeader(header)
  }

  public genesisBlockHash = async (): Promise<string> => {
    const hash: string = await this.retry(async () => {
      return await this.core.rpc.getBlockHash('0x0')
    })

    return hash
  }

  public getChain = async (): Promise<string> => {
    const chain: string = await this.retry(async () => {
      const i = await this.core.rpc.getBlockchainInfo()
      return i.chain
    })
    return chain
  }

  private async retry<T>(func: () => T): Promise<T> {
    return Utils.retry(this.retryTime, this.retryInterval, func)
  }
}

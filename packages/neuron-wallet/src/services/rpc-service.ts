import Core from '@nervosnetwork/ckb-sdk-core'
import { generateCore } from 'services/sdk-core'

import HexUtils from 'utils/hex'
import CommonUtils from 'utils/common'
import { Block } from 'models/chain/block'
import { BlockHeader } from 'models/chain/block-header'
import { TransactionWithStatus } from 'models/chain/transaction-with-status'
import { OutPoint } from 'models/chain/out-point'
import { CellWithStatus } from 'models/chain/cell-with-status'

export default class RpcService {
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
        return (await this.retryGetBlock(num))!
      })
    )

    return blocks
  }

  public getRangeBlockHeaders = async (blockNumbers: string[]): Promise<BlockHeader[]> => {
    const headers: BlockHeader[] = await Promise.all(
      blockNumbers.map(async num => {
        return (await this.retryGetBlockHeader(num))!
      })
    )

    return headers
  }

  public getTipBlockNumber = async (): Promise<string> => {
    return this.core.rpc.getTipBlockNumber()
  }

  public retryGetBlock = async (num: string): Promise<Block | undefined> => {
    return this.retry(async () => {
      return await this.getBlockByNumber(num)
    })
  }

  public retryGetBlockHeader = async (num: string): Promise<BlockHeader | undefined> => {
    return this.retry(async () => {
      return this.getBlockHeaderByNumber(num)
    })
  }

  public getTransaction = async (hash: string): Promise<TransactionWithStatus | undefined> => {
    const result = await this.core.rpc.getTransaction(hash)
    if (result) {
      return TransactionWithStatus.fromSDK(result)
    }
    return undefined
  }

  public async getLiveCell(outPoint: OutPoint, withData: boolean = false): Promise<CellWithStatus> {
    const result = await this.core.rpc.getLiveCell(outPoint.toSDK(), withData)
    return CellWithStatus.fromSDK(result)
  }

  public getHeader = async (hash: string): Promise<BlockHeader | undefined> => {
    const result = await this.core.rpc.getHeader(hash)
    if (result) {
      return BlockHeader.fromSDK(result)
    }
    return undefined
  }

  public getHeaderByNumber = async (num: string): Promise<BlockHeader | undefined> => {
    const result = await this.core.rpc.getHeaderByNumber(HexUtils.toHex(num))
    if (result) {
      return BlockHeader.fromSDK(result)
    }
    return undefined
  }

  public getBlockByNumber = async (num: string): Promise<Block | undefined> => {
    const block = await this.core.rpc.getBlockByNumber(HexUtils.toHex(num))
    if (block) {
      return Block.fromSDK(block)
    }
    return undefined
  }

  public getBlockHeaderByNumber = async (num: string): Promise<BlockHeader | undefined> => {
    const header = await this.core.rpc.getHeaderByNumber(HexUtils.toHex(num))
    if (header) {
      return BlockHeader.fromSDK(header)
    }
    return undefined
  }

  public genesisBlockHash = async (): Promise<string> => {
    return this.retry(async () => {
      return this.core.rpc.getBlockHash('0x0')
    })
  }

  public getChain = async (): Promise<string> => {
    const chain: string = await this.retry(async () => {
      const i = await this.core.rpc.getBlockchainInfo()
      return i.chain
    })
    return chain
  }

  private async retry<T>(func: () => T): Promise<T> {
    return CommonUtils.retry(this.retryTime, this.retryInterval, func)
  }
}

import CKB from '@nervosnetwork/ckb-sdk-core'
import { generateCKB } from 'services/sdk-core'

import HexUtils from 'utils/hex'
import CommonUtils from 'utils/common'
import Block from 'models/chain/block'
import BlockHeader from 'models/chain/block-header'
import TransactionWithStatus from 'models/chain/transaction-with-status'
import OutPoint from 'models/chain/out-point'
import CellWithStatus from 'models/chain/cell-with-status'

export default class RpcService {
  private retryTime: number
  private retryInterval: number
  private ckb: CKB

  constructor(url: string, retryTime: number = 3, retryInterval: number = 100) {
    this.retryTime = retryTime
    this.retryInterval = retryInterval
    this.ckb = generateCKB(url)
  }

  public async getRangeBlocks(blockNumbers: string[]): Promise<Block[]> {
    const blocks: Block[] = await Promise.all(
      blockNumbers.map(async num => {
        return (await this.retryGetBlock(num))!
      })
    )

    return blocks
  }

  public async getRangeBlockHeaders(blockNumbers: string[]): Promise<BlockHeader[]> {
    const headers: BlockHeader[] = await Promise.all(
      blockNumbers.map(async num => {
        return (await this.retryGetBlockHeader(num))!
      })
    )

    return headers
  }

  public async getTipBlockNumber(): Promise<string> {
    return this.ckb.rpc.getTipBlockNumber()
  }

  public async retryGetBlock(num: string): Promise<Block | undefined> {
    return this.retry(async () => {
      return await this.getBlockByNumber(num)
    })
  }

  public async retryGetBlockHeader(num: string): Promise<BlockHeader | undefined> {
    return this.retry(async () => {
      return this.getBlockHeaderByNumber(num)
    })
  }

  public async getTransaction(hash: string): Promise<TransactionWithStatus | undefined> {
    const result = await this.ckb.rpc.getTransaction(hash)
    if (result) {
      return TransactionWithStatus.fromSDK(result)
    }
    return undefined
  }

  public async getLiveCell(outPoint: OutPoint, withData: boolean = false): Promise<CellWithStatus> {
    const result = await this.ckb.rpc.getLiveCell(outPoint.toSDK(), withData)
    return CellWithStatus.fromSDK(result)
  }

  public async getHeader(hash: string): Promise<BlockHeader | undefined> {
    const result = await this.ckb.rpc.getHeader(hash)
    if (result) {
      return BlockHeader.fromSDK(result)
    }
    return undefined
  }

  public async getHeaderByNumber(num: string): Promise<BlockHeader | undefined> {
    const result = await this.ckb.rpc.getHeaderByNumber(HexUtils.toHex(num))
    if (result) {
      return BlockHeader.fromSDK(result)
    }
    return undefined
  }

  public async getBlockByNumber(num: string): Promise<Block | undefined> {
    const block = await this.ckb.rpc.getBlockByNumber(HexUtils.toHex(num))
    if (block) {
      return Block.fromSDK(block)
    }
    return undefined
  }

  public async getBlockHeaderByNumber(num: string): Promise<BlockHeader | undefined> {
    const header = await this.ckb.rpc.getHeaderByNumber(HexUtils.toHex(num))
    if (header) {
      return BlockHeader.fromSDK(header)
    }
    return undefined
  }

  public async genesisBlockHash(): Promise<string> {
    return this.retry(async () => {
      return this.ckb.rpc.getBlockHash('0x0')
    })
  }

  public async getChain(): Promise<string> {
    const chain: string = await this.retry(async () => {
      const i = await this.ckb.rpc.getBlockchainInfo()
      return i.chain
    })
    return chain
  }

  private async retry<T>(func: () => T): Promise<T> {
    return CommonUtils.retry(this.retryTime, this.retryInterval, func)
  }
}

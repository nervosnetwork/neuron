import HexUtils from 'utils/hex'
import CommonUtils from 'utils/common'
import Block from 'models/chain/block'
import BlockHeader from 'models/chain/block-header'
import TransactionWithStatus from 'models/chain/transaction-with-status'
import OutPoint from 'models/chain/out-point'
import CellWithStatus from 'models/chain/cell-with-status'
import logger from 'utils/logger'
import { generateRPC } from 'utils/ckb-rpc'

export default class RpcService {
  private retryTime: number
  private retryInterval: number
  private rpc: ReturnType<typeof generateRPC>

  constructor(url: string, retryTime: number = 3, retryInterval: number = 100) {
    this.retryTime = retryTime
    this.retryInterval = retryInterval
    this.rpc = generateRPC(url)
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
    return this.rpc.getTipBlockNumber()
  }

  public async getTipHeader(): Promise<BlockHeader> {
    const result = await this.rpc.getTipHeader()
    return BlockHeader.fromSDK(result)
  }

  public async retryGetBlockHeader(num: string): Promise<BlockHeader | undefined> {
    return this.retry(async () => {
      return this.getBlockHeaderByNumber(num)
    })
  }

  /**
   * TODO: rejected tx should be handled
   * {
   *   transaction: null,
   *   txStatus: { blockHash: null, status: 'rejected' }
   * }
   */
  public async getTransaction(hash: string): Promise<TransactionWithStatus | undefined> {
    const result = await this.rpc.getTransaction(hash)
    if (result?.transaction) {
      return TransactionWithStatus.fromSDK(result)
    }
    if ((result.txStatus as any) === 'rejected') {
      logger.warn(`Transaction[${hash}] was rejected`)
    }
    return undefined
  }

  public async getLiveCell(outPoint: OutPoint, withData: boolean = false): Promise<CellWithStatus> {
    const result = await this.rpc.getLiveCell(outPoint.toSDK(), withData)
    return CellWithStatus.fromSDK(result)
  }

  public async getHeader(hash: string): Promise<BlockHeader | undefined> {
    const result = await this.rpc.getHeader(hash)
    if (result) {
      return BlockHeader.fromSDK(result)
    }
    return undefined
  }

  public async getHeaderByNumber(num: string): Promise<BlockHeader | undefined> {
    const result = await this.rpc.getHeaderByNumber(HexUtils.toHex(num))
    if (result) {
      return BlockHeader.fromSDK(result)
    }
    return undefined
  }

  public async getGenesisBlock(): Promise<Block | undefined> {
    const block = await this.rpc.getGenesisBlock()
    if (block) {
      return Block.fromSDK(block)
    }
    return undefined
  }

  public async getBlockHeaderByNumber(num: string): Promise<BlockHeader | undefined> {
    const header = await this.rpc.getHeaderByNumber(HexUtils.toHex(num))
    if (header) {
      return BlockHeader.fromSDK(header)
    }
    return undefined
  }

  public async genesisBlockHash(): Promise<string> {
    return this.retry(async () => {
      return this.rpc.getGenesisBlockHash()
    })
  }

  public async getSyncState(): Promise<CKBComponents.SyncState> {
    const syncState = await this.retry(async () => {
      return await this.rpc.syncState()
    })
    return syncState
  }

  public async localNodeInfo() {
    return this.retry(async () => {
      return this.rpc.localNodeInfo()
    })
  }

  private async retry<T>(func: () => T): Promise<T> {
    return CommonUtils.retry(this.retryTime, this.retryInterval, func)
  }
}

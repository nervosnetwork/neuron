import type { LocalNode } from '@ckb-lumos/base'
import CommonUtils from '../utils/common'
import Block from '../models/chain/block'
import BlockHeader from '../models/chain/block-header'
import TransactionWithStatus from '../models/chain/transaction-with-status'
import logger from '../utils/logger'
import { generateRPC } from '../utils/ckb-rpc'
import { NetworkType } from '../models/network'
import TxStatus, { TxStatusType } from '../models/chain/tx-status'

export default class RpcService {
  private retryTime: number
  private retryInterval: number
  private rpc: ReturnType<typeof generateRPC>
  public readonly url: string

  constructor(url: string, type: NetworkType, retryTime: number = 3, retryInterval: number = 100) {
    this.url = url
    this.retryTime = retryTime
    this.retryInterval = retryInterval
    this.rpc = generateRPC(url, type)
  }

  public async getTipBlockNumber(): Promise<string> {
    return this.rpc.getTipBlockNumber()
  }

  public async getTipHeader(): Promise<BlockHeader> {
    const result = await this.rpc.getTipHeader()
    return BlockHeader.fromSDK(result)
  }

  public async getTransaction(
    hash: string
  ): Promise<TransactionWithStatus | undefined | { transaction: null; txStatus: TxStatus }> {
    const result = await this.rpc.getTransaction(hash)
    if (result?.transaction) {
      return TransactionWithStatus.fromSDK(result)
    }
    if (result.txStatus.status === TxStatusType.Rejected) {
      logger.warn(`Transaction[${hash}] was rejected`)
      return {
        transaction: null,
        txStatus: TxStatus.fromSDK(result.txStatus),
      }
    }
    return undefined
  }

  public async getHeader(hash: string): Promise<BlockHeader | undefined> {
    const result = await this.rpc.getHeader(hash)
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

  public async localNodeInfo(): Promise<LocalNode> {
    return this.retry(async () => {
      return this.rpc.localNodeInfo()
    })
  }

  private async retry<T>(func: () => T): Promise<T> {
    return CommonUtils.retry(this.retryTime, this.retryInterval, func)
  }
}

import { Tip } from '@ckb-lumos/base'
import logger from '../../utils/logger'
import CommonUtils from '../../utils/common'
import RpcService from '../../services/rpc-service'
import { Address } from '../../models/address'
import { Connector } from './connector'
import { NetworkType } from '../../models/network'
import IndexerCacheService from './indexer-cache-service'

export default class IndexerConnector extends Connector {
  private rpcService: RpcService

  constructor(addresses: Address[], nodeUrl: string, indexerUrl: string, nodeType: NetworkType) {
    super({ addresses, nodeUrl, indexerUrl })
    this.rpcService = new RpcService(nodeUrl, nodeType)
  }

  private async synchronize(indexerTipBlock: Tip) {
    if (!indexerTipBlock) {
      return
    }

    await this.upsertTxHashes()
    const indexerTipNumber = parseInt(indexerTipBlock.blockNumber, 16)
    await this.notifyAndSyncNext(indexerTipNumber)
  }

  private async initSync() {
    await this.processNextBlockNumber()

    while (this.pollingIndexer) {
      const indexerTipBlock = await this.indexer.tip()
      await this.synchronize(indexerTipBlock)
      await CommonUtils.sleep(5000)
    }
  }

  public async connect() {
    try {
      this.pollingIndexer = true

      this.initSync()
    } catch (error) {
      logger.error(`Error connecting to Indexer: ${error.message}`)
      throw error
    }
  }

  async processTxsInNextBlockNumber() {
    const [nextBlockNumber, txHashesInNextBlock] = await this.getTxHashesWithNextUnprocessedBlockNumber()
    if (nextBlockNumber !== undefined && txHashesInNextBlock.length) {
      this.processingBlockNumber = nextBlockNumber
      this.transactionsSubject.next({ txHashes: txHashesInNextBlock, params: this.processingBlockNumber })
    }
  }

  protected async upsertTxHashes(): Promise<string[]> {
    const arrayOfInsertedTxHashes = []
    for (const [walletId, addressMetas] of [...this.addressesByWalletId.entries()]) {
      const indexerCacheService = new IndexerCacheService(walletId, addressMetas, this.rpcService, this.indexer)
      const txHashes = await indexerCacheService.upsertTxHashes()
      arrayOfInsertedTxHashes.push(txHashes)
    }
    return arrayOfInsertedTxHashes.flat()
  }

  public async notifyCurrentBlockNumberProcessed(blockNumber: string) {
    if (blockNumber === this.processingBlockNumber) {
      this.processingBlockNumber = undefined
    } else {
      return
    }
    this.processNextBlockNumber()
  }
}

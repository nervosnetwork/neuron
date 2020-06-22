import logger from 'electron-log'
import { Subject } from 'rxjs'
import { queue, AsyncQueue } from 'async'
import { Indexer, Tip } from '@ckb-lumos/indexer'
import CommonUtils from 'utils/common'
import RpcService from 'services/rpc-service'
import TransactionWithStatus from 'models/chain/transaction-with-status'
import { Address } from 'database/address/address-dao'
import AddressMeta from 'database/address/meta'
import IndexerTxHashCache from 'database/chain/entities/indexer-tx-hash-cache'
import IndexerCacheService from './indexer-cache-service'

export default class IndexerConnector {
  private indexer: Indexer
  private rpcService: RpcService
  private addressesByWalletId: Map<string, AddressMeta[]>
  private pollingIndexer: boolean = false
  private processNextBlockNumberQueue: AsyncQueue<null> | undefined
  private indexerTip: Tip | undefined
  public readonly blockTipSubject: Subject<Tip> = new Subject<Tip>()
  public readonly transactionsSubject: Subject<Array<TransactionWithStatus>> = new Subject<Array<TransactionWithStatus>>()

  constructor(addresses: Address[], nodeUrl: string, indexerFolderPath: string) {
    this.indexer = new Indexer(nodeUrl, indexerFolderPath)
    this.rpcService = new RpcService(nodeUrl)

    this.addressesByWalletId = addresses
      .map(address => AddressMeta.fromObject(address))
      .reduce((addressesByWalletId, addressMeta) => {
        if (!addressesByWalletId.has(addressMeta.walletId)) {
          addressesByWalletId.set(addressMeta.walletId, [])
        }

        const addressMetas = addressesByWalletId.get(addressMeta.walletId)
        addressMetas!.push(addressMeta)

        return addressesByWalletId
      }, new Map<string, AddressMeta[]>())
  }

  public async connect() {
    try {
      this.indexer.startForever()
      this.pollingIndexer = true

      this.processNextBlockNumberQueue = queue(async () => this.processNextBlockNumber(), 1)
      this.processNextBlockNumberQueue.error((err: any) => {
        logger.error(err)
      })

      // check unprocessed instead?
      this.processNextBlockNumberQueue.push(null)
      await this.processNextBlockNumberQueue.drain()

      while (this.pollingIndexer) {
        this.indexerTip = this.indexer.tip()

        console.time('tx hash')
        const newInserts = await this.upsertTxHashes()
        console.timeEnd('tx hash')

        const nextUnprocessedBlockTip = await IndexerCacheService.nextUnprocessedBlock()
        if (nextUnprocessedBlockTip) {
          this.blockTipSubject.next({
            block_number: nextUnprocessedBlockTip.blockNumber,
            block_hash: nextUnprocessedBlockTip.blockHash,
          })
        }
        else if (this.indexerTip) {
          this.blockTipSubject.next(this.indexerTip)
        }

        if (newInserts.length) {
          console.log('hashinsert', newInserts.length)
          this.processNextBlockNumberQueue.push(null)
          await this.processNextBlockNumberQueue.drain()
        }

        await CommonUtils.sleep(5000)
      }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  private async getTxsInNextUnprocessedBlockNumber() {
    const txHashCachesByNextBlockNumberAndAddress = await Promise.all(
      [...this.addressesByWalletId.entries()].map(async ([walletId, addressMetas]) => {
        const indexerCacheService = new IndexerCacheService(walletId, addressMetas, this.rpcService, this.indexer)
        return indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
      })
    )
    const groupedTxHashCaches = txHashCachesByNextBlockNumberAndAddress
      .flat()
      .sort((a, b) => {
        return parseInt(a.blockTimestamp) - parseInt(b.blockTimestamp)
      })
      .reduce((grouped, txHashCache) => {
        if (!grouped.get(txHashCache.blockNumber.toString())) {
          grouped.set(txHashCache.blockNumber.toString(), [])
        }
        grouped.get(txHashCache.blockNumber.toString())!.push(txHashCache)

        return grouped
      }, new Map<string, Array<IndexerTxHashCache>>())

    const nextUnprocessedBlockNumber = [...groupedTxHashCaches.keys()]
      .sort((a, b) => parseInt(a) - parseInt(b))
      .shift()

    if (!nextUnprocessedBlockNumber) {
      return []
    }

    const txHashCachesInNextUnprocessedBlockNumber = groupedTxHashCaches.get(nextUnprocessedBlockNumber)
    const txsInNextUnprocessedBlockNumber = await this.fetchTxsWithStatus(
      txHashCachesInNextUnprocessedBlockNumber!.map(({txHash}) => txHash)
    )

    return txsInNextUnprocessedBlockNumber
  }

  private async upsertTxHashes(): Promise<string[]> {
    const nextUnprocessedBlock = await IndexerCacheService.nextUnprocessedBlock()
    if (nextUnprocessedBlock) {
      return []
    }
    const arrayOfInsertedTxHashes = await Promise.all(
      [...this.addressesByWalletId.entries()].map(([walletId, addressMetas]) => {
        const indexerCacheService = new IndexerCacheService(walletId, addressMetas, this.rpcService, this.indexer)
        return indexerCacheService.upsertTxHashes()
      })
    )
    return arrayOfInsertedTxHashes.flat()
  }

  private async processNextBlockNumber() {
    console.time('next')
    const txsInNextUnprocessedBlockNumber = await this.getTxsInNextUnprocessedBlockNumber()
    console.timeEnd('next')
    console.log('next count', txsInNextUnprocessedBlockNumber.length)
    if (txsInNextUnprocessedBlockNumber.length) {
      this.transactionsSubject.next(txsInNextUnprocessedBlockNumber)
    }
  }

  private async fetchTxsWithStatus(txHashes: string[]) {
    const txsWithStatus: TransactionWithStatus[] = []
    const fetchTxsWithStatusQueue = queue(async (hash: string) => {
      const txWithStatus = await this.rpcService.getTransaction(hash)
      if (!txWithStatus) {
        throw new Error(`failed to fetch transaction for hash ${hash}`)
      }
      const blockHeader = await this.rpcService.getHeader(txWithStatus!.txStatus.blockHash!)
      txWithStatus!.transaction.blockNumber = blockHeader?.number
      txWithStatus!.transaction.blockHash = txWithStatus!.txStatus.blockHash!
      txWithStatus!.transaction.timestamp = blockHeader?.timestamp
      txsWithStatus.push(txWithStatus)
    }, 1)

    fetchTxsWithStatusQueue.push(txHashes)

    await new Promise((resolve, reject) => {
      fetchTxsWithStatusQueue.drain(resolve)
      fetchTxsWithStatusQueue.error(reject)
    })

    return txsWithStatus
  }

  public async notifyCurrentBlockNumberProcessed(blockNumber: string) {
    for (const [walletId, addressMetas] of this.addressesByWalletId.entries()) {
      const indexerCacheService = new IndexerCacheService(walletId, addressMetas, this.rpcService, this.indexer)
      await indexerCacheService.updateProcessedTxHashes(blockNumber)
    }
    this.processNextBlockNumberQueue!.push(null)
  }
}

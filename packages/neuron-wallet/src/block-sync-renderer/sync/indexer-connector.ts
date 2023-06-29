import { Subject } from 'rxjs'
import { queue, QueueObject } from 'async'
import { Tip, QueryOptions } from '@ckb-lumos/base'
import { Indexer as CkbIndexer, CellCollector } from '@ckb-lumos/ckb-indexer'
import logger from '../../utils/logger'
import CommonUtils from '../../utils/common'
import RpcService from '../../services/rpc-service'
import { Address } from '../../models/address'
import AddressMeta from '../../database/address/meta'
import IndexerTxHashCache from '../../database/chain/entities/indexer-tx-hash-cache'
import IndexerCacheService from './indexer-cache-service'
import { BlockTips, LumosCellQuery, Connector } from './connector'

export default class IndexerConnector extends Connector<string | undefined> {
  private indexer: CkbIndexer
  private rpcService: RpcService
  private addressesByWalletId: Map<string, AddressMeta[]>
  private processNextBlockNumberQueue: QueueObject<null> | undefined
  private indexerQueryQueue: QueueObject<LumosCellQuery> | undefined

  private processingBlockNumber: string | undefined
  private pollingIndexer: boolean = false
  public readonly blockTipsSubject: Subject<BlockTips> = new Subject<BlockTips>()
  public readonly transactionsSubject = new Subject<{ txHashes: CKBComponents.Hash[]; params: string | undefined }>()

  constructor(addresses: Address[], nodeUrl: string, indexerUrl: string) {
    super()
    this.indexer = new CkbIndexer(nodeUrl, indexerUrl)
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

    this.processNextBlockNumberQueue = queue(async () => this.processTxsInNextBlockNumber(), 1)
    this.processNextBlockNumberQueue.error((err: any) => {
      logger.error(`Error in processing next block number queue: ${err}`)
    })

    this.indexerQueryQueue = queue(async (query: any) => {
      return await this.collectLiveCellsByScript(query)
    })
  }

  private async synchronize(indexerTipBlock: Tip) {
    if (!indexerTipBlock) {
      return
    }

    await this.upsertTxHashes()

    const indexerTipNumber = parseInt(indexerTipBlock.blockNumber, 16)

    const nextUnprocessedBlockTip = await IndexerCacheService.nextUnprocessedBlock([...this.addressesByWalletId.keys()])
    if (nextUnprocessedBlockTip) {
      this.blockTipsSubject.next({
        cacheTipNumber: parseInt(nextUnprocessedBlockTip.blockNumber),
        indexerTipNumber,
      })
      if (!this.processingBlockNumber) {
        await this.processNextBlockNumber()
      }
    } else {
      this.blockTipsSubject.next({
        cacheTipNumber: indexerTipNumber,
        indexerTipNumber,
      })
    }
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

  public async getLiveCellsByScript(query: LumosCellQuery) {
    return new Promise((resolve, reject) => {
      this.indexerQueryQueue!.push(query, (err: any, result: unknown) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  private async collectLiveCellsByScript(query: LumosCellQuery) {
    const { lock, type, data } = query
    if (!lock && !type) {
      throw new Error('at least one parameter is required')
    }

    const queries: QueryOptions = {}
    if (lock) {
      queries.lock = lock
    }
    if (type) {
      queries.type = type
    }
    queries.data = data || 'any'

    const collector = new CellCollector(this.indexer, queries)

    const result = []
    for await (const cell of collector.collect()) {
      //somehow the lumos indexer returns an invalid hash type "lock" for hash type "data"
      //for now we have to fix it here
      const cellOutput = cell.cellOutput
      // FIXME
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (cellOutput.type?.hashType === 'lock') {
        console.error('Unexpected hash type "lock" found with the query', JSON.stringify(queries))
        cellOutput.type.hashType = 'data'
      }
      result.push(cell)
    }
    return result
  }

  private async getTxHashesWithNextUnprocessedBlockNumber(): Promise<[string | undefined, string[]]> {
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

    const nextUnprocessedBlockNumber = [...groupedTxHashCaches.keys()].sort((a, b) => parseInt(a) - parseInt(b)).shift()

    if (!nextUnprocessedBlockNumber) {
      return [undefined, []]
    }

    const txHashCachesInNextUnprocessedBlockNumber = groupedTxHashCaches.get(nextUnprocessedBlockNumber)

    return [nextUnprocessedBlockNumber, txHashCachesInNextUnprocessedBlockNumber!.map(({ txHash }) => txHash)]
  }

  private async upsertTxHashes(): Promise<string[]> {
    const arrayOfInsertedTxHashes = []
    for (const [walletId, addressMetas] of [...this.addressesByWalletId.entries()]) {
      const indexerCacheService = new IndexerCacheService(walletId, addressMetas, this.rpcService, this.indexer)
      const txHashes = await indexerCacheService.upsertTxHashes()
      arrayOfInsertedTxHashes.push(txHashes)
    }
    return arrayOfInsertedTxHashes.flat()
  }

  private async processNextBlockNumber() {
    this.processNextBlockNumberQueue!.push(null)
    await this.processNextBlockNumberQueue!.drain()
  }

  private async processTxsInNextBlockNumber() {
    const [nextBlockNumber, txHashesInNextBlock] = await this.getTxHashesWithNextUnprocessedBlockNumber()
    if (nextBlockNumber !== undefined && txHashesInNextBlock.length) {
      this.processingBlockNumber = nextBlockNumber
      this.transactionsSubject.next({ txHashes: txHashesInNextBlock, params: this.processingBlockNumber })
    }
  }

  public notifyCurrentBlockNumberProcessed(blockNumber: string) {
    if (blockNumber === this.processingBlockNumber) {
      delete this.processingBlockNumber
    } else {
      return
    }
    this.processNextBlockNumber()
  }

  public stop(): void {
    this.pollingIndexer = false
  }
}

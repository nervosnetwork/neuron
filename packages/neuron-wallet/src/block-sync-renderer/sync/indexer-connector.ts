import type { ScriptHashType } from 'models/chain/script'
import { Subject } from 'rxjs'
import { queue, AsyncQueue } from 'async'
import { Tip } from '@ckb-lumos/base'
import { Indexer, CellCollector, QueryOptions } from 'block-sync-renderer/mercury/indexer'
import logger from 'utils/logger'
import CommonUtils from 'utils/common'
import RpcService from 'services/rpc-service'
import TransactionWithStatus from 'models/chain/transaction-with-status'
import { Address } from "models/address"
import AddressMeta from 'database/address/meta'
import IndexerTxHashCache from 'database/chain/entities/indexer-tx-hash-cache'
import IndexerCacheService from './indexer-cache-service'

export interface LumosCellQuery {
  lock: { codeHash: string, hashType: ScriptHashType, args: string } | null,
  type: { codeHash: string, hashType: ScriptHashType, args: string } | null,
  data: string | null
}

export interface LumosCell {
  block_hash: string
  out_point: {
    tx_hash: string
    index: string
  }
  cell_output: {
    capacity: string
    lock: {
      code_hash: string
      args: string
      hash_type: string
    }
    type?: {
      code_hash: string
      args: string
      hash_type: string
    }
  }
  data?: string
}

export interface BlockTips {
  cacheTipNumber: number
  indexerTipNumber: number | undefined
}

export default class IndexerConnector {
  private indexer: Indexer
  private rpcService: RpcService
  private addressesByWalletId: Map<string, AddressMeta[]>
  private processNextBlockNumberQueue: AsyncQueue<null> | undefined
  private indexerQueryQueue: AsyncQueue<LumosCellQuery> | undefined

  private processingBlockNumber: string | undefined
  public pollingIndexer: boolean = false
  public readonly blockTipsSubject: Subject<BlockTips> = new Subject<BlockTips>()
  public readonly transactionsSubject: Subject<Array<TransactionWithStatus>> = new Subject<Array<TransactionWithStatus>>()

  constructor(
    addresses: Address[],
    nodeUrl: string,
    indexerUrl: string
  ) {
    this.indexer = new Indexer(nodeUrl, indexerUrl)
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

    const indexerTipNumber = parseInt(indexerTipBlock.block_number, 16)

    const nextUnprocessedBlockTip = await IndexerCacheService.nextUnprocessedBlock([...this.addressesByWalletId.keys()])
    if (nextUnprocessedBlockTip) {
      this.blockTipsSubject.next({
        cacheTipNumber: parseInt(nextUnprocessedBlockTip.blockNumber),
        indexerTipNumber,
      })
      if (!this.processingBlockNumber) {
        await this.processNextBlockNumber()
      }
    }
    else {
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
      this.indexer.startForever()
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
      queries.lock = {
        code_hash: lock.codeHash,
        hash_type: lock.hashType,
        args: lock.args
      }
    }
    if (type) {
      queries.type = {
        code_hash: type.codeHash,
        hash_type: type.hashType,
        args: type.args
      }
    }
    queries.data = data || 'any'

    const collector = new CellCollector(this.indexer, queries)

    const result = []
    for await (const cell of collector.collect()) {
      //somehow the lumos indexer returns an invalid hash type "lock" for hash type "data"
      //for now we have to fix it here
      const cellOutput: any = cell.cell_output
      if (cellOutput.type?.hash_type === 'lock') {
        cellOutput.type.hash_type = 'data'
      }
      result.push(cell)
    }
    return result
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
      txHashCachesInNextUnprocessedBlockNumber!.map(({ txHash }) => txHash)
    )

    return txsInNextUnprocessedBlockNumber
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
    const txsInNextUnprocessedBlockNumber = await this.getTxsInNextUnprocessedBlockNumber()
    if (txsInNextUnprocessedBlockNumber.length) {
      this.processingBlockNumber = txsInNextUnprocessedBlockNumber[0].transaction.blockNumber
      this.transactionsSubject.next(txsInNextUnprocessedBlockNumber)
    }
  }

  private async fetchTxsWithStatus(txHashes: string[]) {
    const txsWithStatus: TransactionWithStatus[] = []

    for (const hash of txHashes) {
      const txWithStatus = await this.rpcService.getTransaction(hash)
      if (!txWithStatus) {
        throw new Error(`failed to fetch transaction for hash ${hash}`)
      }
      const blockHeader = await this.rpcService.getHeader(txWithStatus!.txStatus.blockHash!)
      txWithStatus!.transaction.blockNumber = blockHeader!.number
      txWithStatus!.transaction.blockHash = txWithStatus!.txStatus.blockHash!
      txWithStatus!.transaction.timestamp = blockHeader!.timestamp
      txsWithStatus.push(txWithStatus)
    }

    return txsWithStatus
  }

  public notifyCurrentBlockNumberProcessed(blockNumber: string) {
    if (blockNumber === this.processingBlockNumber) {
      delete this.processingBlockNumber
    }
    else {
      return
    }
    this.processNextBlockNumber()
  }
}

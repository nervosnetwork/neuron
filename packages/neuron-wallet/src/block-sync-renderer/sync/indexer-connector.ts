import logger from 'electron-log'
import { Subject } from 'rxjs'
import { queue, AsyncQueue } from 'async'
import { QueryOptions, HashType } from '@ckb-lumos/base'
import { Indexer, Tip, CellCollector } from '@ckb-lumos/indexer'
import CommonUtils from 'utils/common'
import RpcService from 'services/rpc-service'
import TransactionWithStatus from 'models/chain/transaction-with-status'
import { Address } from 'database/address/address-dao'
import AddressMeta from 'database/address/meta'
import IndexerTxHashCache from 'database/chain/entities/indexer-tx-hash-cache'
import IndexerCacheService from './indexer-cache-service'
import IndexerFolderManager from './indexer-folder-manager'

export interface LumosCellQuery {
  lock: {codeHash: string, hashType: HashType, args: string} | null,
  type: {codeHash: string, hashType: HashType, args: string} | null,
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

export default class IndexerConnector {
  private indexer: Indexer
  private rpcService: RpcService
  private addressesByWalletId: Map<string, AddressMeta[]>
  private processNextBlockNumberQueue: AsyncQueue<null> | undefined
  private processingBlockNumber: string | undefined
  private indexerTip: Tip | undefined
  public pollingIndexer: boolean = false
  public readonly blockTipSubject: Subject<Tip> = new Subject<Tip>()
  public readonly transactionsSubject: Subject<Array<TransactionWithStatus>> = new Subject<Array<TransactionWithStatus>>()

  constructor(
    addresses: Address[],
    nodeUrl: string,
    indexerFolderPath: string = IndexerFolderManager.IndexerDataFolderPath
  ) {
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

    this.processNextBlockNumberQueue = queue(async () => this.processTxsInNextBlockNumber(), 1)
    this.processNextBlockNumberQueue.error((err: any) => {
      logger.error(err)
    })
  }

  public async connect() {
    try {
      this.indexer.startForever()
      this.pollingIndexer = true

      await this.processNextBlockNumber()

      while (this.pollingIndexer) {
        this.indexerTip = await this.indexer.tip()

        await this.upsertTxHashes()

        const nextUnprocessedBlockTip = await IndexerCacheService.nextUnprocessedBlock([...this.addressesByWalletId.keys()])
        if (nextUnprocessedBlockTip) {
          this.blockTipSubject.next({
            block_number: nextUnprocessedBlockTip.blockNumber,
            block_hash: nextUnprocessedBlockTip.blockHash,
          })
          if (!this.processingBlockNumber) {
            await this.processNextBlockNumber()
          }
        }
        else if (this.indexerTip) {
          this.blockTipSubject.next(this.indexerTip)
        }

        await CommonUtils.sleep(5000)
      }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  public async getLiveCellsByScript(query: LumosCellQuery) {
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
      txHashCachesInNextUnprocessedBlockNumber!.map(({txHash}) => txHash)
    )

    return txsInNextUnprocessedBlockNumber
  }

  private async upsertTxHashes(): Promise<string[]> {
    const arrayOfInsertedTxHashes = await Promise.all(
      [...this.addressesByWalletId.entries()].map(([walletId, addressMetas]) => {
        const indexerCacheService = new IndexerCacheService(walletId, addressMetas, this.rpcService, this.indexer)
        return indexerCacheService.upsertTxHashes()
      })
    )
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
      txWithStatus!.transaction.blockNumber = blockHeader?.number
      txWithStatus!.transaction.blockHash = txWithStatus!.txStatus.blockHash!
      txWithStatus!.transaction.timestamp = blockHeader?.timestamp
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

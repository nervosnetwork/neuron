import { In } from 'typeorm'
import { queue } from 'async'
import AddressMeta from '../../database/address/meta'
import IndexerTxHashCache from '../../database/chain/entities/indexer-tx-hash-cache'
import RpcService from '../../services/rpc-service'
import TransactionWithStatus from '../../models/chain/transaction-with-status'
import SyncInfoEntity from '../../database/chain/entities/sync-info'
import { getConnection } from '../../database/chain/connection'
import { TransactionCollector, Indexer as CkbIndexer, CellCollector } from '@ckb-lumos/ckb-indexer'

export default class IndexerCacheService {
  private addressMetas: AddressMeta[]
  private rpcService: RpcService
  private walletId: string
  private indexer: CkbIndexer
  #cacheBlockNumberEntityMap: Map<string, SyncInfoEntity> = new Map()

  constructor(walletId: string, addressMetas: AddressMeta[], rpcService: RpcService, indexer: CkbIndexer) {
    for (const addressMeta of addressMetas) {
      if (addressMeta.walletId !== walletId) {
        throw new Error(`address ${addressMeta.address} does not belong to wallet id ${walletId}`)
      }
    }

    this.walletId = walletId
    this.addressMetas = addressMetas
    this.rpcService = rpcService
    this.indexer = indexer
  }

  private static async getTxHashes(walletIds: string[]): Promise<IndexerTxHashCache[]> {
    return getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        walletId: In(walletIds),
      })
      .getMany()
  }

  public static async nextUnprocessedBlock(walletIds: string[]): Promise<string | undefined> {
    const result = await getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where('walletId IN (:...walletIds) and isProcessed = false', { walletIds })
      .orderBy('blockNumber', 'ASC')
      .getOne()

    if (!result) {
      return
    }

    return result.blockNumber.toString()
  }

  public static async updateCacheProcessed(txHash: string) {
    await getConnection()
      .createQueryBuilder()
      .update(IndexerTxHashCache)
      .set({
        isProcessed: true,
      })
      .where({
        txHash,
      })
      .execute()
  }

  private async fetchTxMapping(): Promise<Map<string, Array<{ address: string; lockHash: string }>>> {
    const currentHeaderBlockNumber = await this.rpcService.getTipBlockNumber()
    const mappingsByTxHash = new Map<string, Array<{ address: string; lockHash: string }>>()
    for (const addressMeta of this.addressMetas) {
      const lastCacheBlockNumber = await this.getCachedBlockNumber(addressMeta.blake160)
      const lockScripts = [
        addressMeta.generateDefaultLockScript(),
        addressMeta.generateACPLockScript(),
        addressMeta.generateLegacyACPLockScript(),
      ]

      for (const lockScript of lockScripts) {
        const transactionCollector = new TransactionCollector(
          this.indexer,
          {
            lock: lockScript,
            fromBlock: lastCacheBlockNumber.value,
            toBlock: currentHeaderBlockNumber,
          },
          this.rpcService.url,
          {
            includeStatus: false,
          }
        )

        const fetchedTxHashes = await transactionCollector.getTransactionHashes()
        if (!fetchedTxHashes.length) {
          continue
        }

        for (const txHash of fetchedTxHashes) {
          mappingsByTxHash.set(txHash, [
            {
              address: addressMeta.address,
              lockHash: lockScript.computeHash(),
            },
          ])
        }
      }

      const lockScriptsForCellCollection = [
        {
          lockScript: addressMeta.generateSingleMultiSignLockScript(),
          argsLen: 28,
        },
        {
          lockScript: addressMeta.generateChequeLockScriptWithReceiverLockHash(),
          argsLen: 40,
        },
      ]

      for (const { lockScript, argsLen } of lockScriptsForCellCollection) {
        const cellCollector = new CellCollector(this.indexer, {
          lock: {
            codeHash: lockScript.codeHash,
            hashType: lockScript.hashType,
            args: lockScript.args.slice(0, 42),
          },
          argsLen,
          fromBlock: lastCacheBlockNumber.value,
          toBlock: currentHeaderBlockNumber,
        })

        for await (const cell of cellCollector.collect()) {
          const txHash = cell.outPoint!.txHash!
          mappingsByTxHash.set(txHash, [
            {
              address: addressMeta.address,
              lockHash: lockScript.computeHash(),
            },
          ])
        }
      }
    }
    return mappingsByTxHash
  }

  private async getCachedBlockNumber(blake160: string) {
    let cacheBlockNumberEntity = this.#cacheBlockNumberEntityMap.get(blake160)
    if (!cacheBlockNumberEntity) {
      cacheBlockNumberEntity =
        (await getConnection()
          .getRepository(SyncInfoEntity)
          .findOneBy({ name: SyncInfoEntity.getLastCachedKey(blake160) })) ??
        SyncInfoEntity.fromObject({
          name: SyncInfoEntity.getLastCachedKey(blake160),
          value: '0x0',
        })
      this.#cacheBlockNumberEntityMap.set(blake160, cacheBlockNumberEntity)
    }

    return cacheBlockNumberEntity
  }

  private async saveCacheBlockNumber(cacheBlockNumber: string) {
    const entities = this.addressMetas.map(v =>
      SyncInfoEntity.fromObject({
        name: SyncInfoEntity.getLastCachedKey(v.blake160),
        value: cacheBlockNumber,
      })
    )
    await getConnection().manager.save(entities, { chunk: 100 })
  }

  public async upsertTxHashes(): Promise<string[]> {
    const tipBlockNumber = await this.rpcService.getTipBlockNumber()
    const mappingsByTxHash = await this.fetchTxMapping()

    const fetchedTxHashes = [...mappingsByTxHash.keys()]
    if (!fetchedTxHashes.length) {
      await this.saveCacheBlockNumber(tipBlockNumber)
      return []
    }
    const txMetasCaches = await IndexerCacheService.getTxHashes([this.walletId])
    const cachedTxHashes = txMetasCaches.map(meta => meta.txHash.toString())

    const cachedTxHashesSet = new Set(cachedTxHashes)

    const newTxHashes = fetchedTxHashes.filter(hash => !cachedTxHashesSet.has(hash))

    if (!newTxHashes.length) {
      await this.saveCacheBlockNumber(tipBlockNumber)
      return []
    }

    const txsWithStatus: TransactionWithStatus[] = []
    const fetchBlockDetailsQueue = queue(async (hash: string) => {
      const txWithStatus = await this.rpcService.getTransaction(hash)
      if (!txWithStatus?.transaction) {
        return
      }
      const blockHeader = await this.rpcService.getHeader(txWithStatus!.txStatus.blockHash!)
      txWithStatus!.transaction.blockNumber = blockHeader!.number
      txWithStatus!.transaction.blockHash = txWithStatus!.txStatus.blockHash!
      txWithStatus!.transaction.timestamp = blockHeader!.timestamp

      txsWithStatus.push(txWithStatus)
    }, 1)

    fetchBlockDetailsQueue.push(newTxHashes)

    await new Promise<void>((resolve, reject) => {
      fetchBlockDetailsQueue.error(reject)
      fetchBlockDetailsQueue.drain(resolve)
    })

    const indexerCaches: IndexerTxHashCache[] = []
    for (const txWithStatus of txsWithStatus) {
      const { transaction } = txWithStatus
      const mappings = mappingsByTxHash.get(transaction.hash!)
      if (!mappings) {
        continue
      }

      for (const { lockHash } of mappings) {
        indexerCaches.push(
          IndexerTxHashCache.fromObject({
            txHash: transaction.hash!,
            blockNumber: parseInt(transaction.blockNumber!),
            lockHash,
            walletId: this.walletId,
          })
        )
      }
    }
    indexerCaches.sort((a, b) => a.blockNumber - b.blockNumber)
    await getConnection().manager.save(indexerCaches, { chunk: 100 })

    await this.saveCacheBlockNumber(tipBlockNumber)
    return newTxHashes
  }

  public static async upsertIndexerCache(
    txs: {
      txHash: string
      txIndex: string
      blockNumber: string
      lockHash: string
      address: string
      walletId: string
    }[]
  ): Promise<string[]> {
    if (!txs.length) {
      return []
    }
    const walletIds = txs.map(v => v.walletId)
    const txMetasCaches = await IndexerCacheService.getTxHashes(walletIds)
    const cachedTxHashes = txMetasCaches.map(meta => meta.txHash.toString())

    const cachedTxHashesSet = new Set(cachedTxHashes)

    const newTxHashes = txs.filter(({ txHash }) => !cachedTxHashesSet.has(txHash))

    if (!newTxHashes.length) {
      return []
    }
    const indexerCaches: IndexerTxHashCache[] = newTxHashes.map(v =>
      IndexerTxHashCache.fromObject({
        txHash: v.txHash,
        blockNumber: parseInt(v.blockNumber!),
        lockHash: v.lockHash,
        walletId: v.walletId,
      })
    )
    indexerCaches.sort((a, b) => a.blockNumber - b.blockNumber)
    await getConnection().manager.save(indexerCaches, { chunk: 100 })
    return newTxHashes.map(v => v.txHash)
  }

  public async updateProcessedTxHashes(blockNumber: string) {
    await getConnection()
      .createQueryBuilder()
      .update(IndexerTxHashCache)
      .set({
        isProcessed: true,
      })
      .where({
        blockNumber: blockNumber,
        walletId: this.walletId,
      })
      .execute()
  }

  public static async nextUnprocessedTxsGroupedByBlockNumber(walletId: string): Promise<IndexerTxHashCache[]> {
    const cache = await getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        isProcessed: false,
        walletId,
      })
      .orderBy('blockNumber', 'ASC')
      .getOne()

    if (!cache) {
      return []
    }

    const { blockNumber } = cache
    return await getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        blockNumber,
        isProcessed: false,
        walletId,
      })
      .getMany()
  }
}

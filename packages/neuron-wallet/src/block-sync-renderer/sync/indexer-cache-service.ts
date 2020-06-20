import { getConnection } from 'typeorm'
import AddressMeta from "database/address/meta"
import IndexerTxHashCache from 'database/chain/entities/indexer-tx-hash-cache'
import RpcService from 'services/rpc-service'
import { Indexer } from '@ckb-lumos/indexer'


export default class IndexerCacheService {
  private addressMetas: AddressMeta[]
  private rpcService: RpcService
  private indexer: Indexer
  private walletId: string

  constructor(
    walletId: string,
    addressMetas: AddressMeta[],
    rpcService: RpcService,
    indexer: Indexer
  ) {
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

  private async countTxHashes(): Promise<number> {
    return getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        walletId: this.walletId
      })
      .getCount()
  }

  private async getTxHashes(): Promise<IndexerTxHashCache[]> {
    return getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        walletId: this.walletId
      })
      .getMany()
  }

  public async upsertTxHashes(): Promise<string[]> {
    const mappingsByTxHash = new Map()
    for (const addressMeta of this.addressMetas) {
      const lockScripts = [
        addressMeta.generateDefaultLockScript()
      ]

      for (const lockScript of lockScripts) {
        const fetchedTxHashes = this.indexer.getTransactionsByLockScript({
          code_hash: lockScript.codeHash,
          hash_type: lockScript.hashType,
          args: lockScript.args
        })

        if (!fetchedTxHashes || !fetchedTxHashes.length) {
          continue
        }

        for (const txHash of fetchedTxHashes) {
          if (!mappingsByTxHash.get(txHash)) {
            mappingsByTxHash.set(txHash, [])
          }

          const mappings = mappingsByTxHash.get(txHash)
          mappings.push({
            address: addressMeta.address,
            lockHash: lockScript.computeHash()
          })
        }
      }
    }

    const fetchedTxHashes = [...mappingsByTxHash.keys()]
    const fetchedTxHashCount = fetchedTxHashes
      .reduce((sum, txHash) => sum + mappingsByTxHash.get(txHash).length, 0)

    const txCount = await this.countTxHashes()
    if (fetchedTxHashCount === txCount) {
      return []
    }

    const txMetasCaches = await this.getTxHashes()
    const cachedTxHashes = txMetasCaches.map(meta => meta.txHash.toString())

    const cachedTxHashesSet = new Set(cachedTxHashes)

    const newTxHashes = fetchedTxHashes.filter(hash => !cachedTxHashesSet.has(hash))

    if (!newTxHashes.length) {
      return []
    }

    const arrayOfTxWithStatus = await Promise.all(
      newTxHashes.map(async hash => {
        const txWithStatus = await this.rpcService.getTransaction(hash)
        if (!txWithStatus) {
          return
        }
        const blockHeader = await this.rpcService.getHeader(txWithStatus!.txStatus.blockHash!)
        txWithStatus!.transaction.blockNumber = blockHeader?.number
        txWithStatus!.transaction.blockHash = txWithStatus!.txStatus.blockHash!
        txWithStatus!.transaction.timestamp = blockHeader?.timestamp
        return txWithStatus
      })
    )

    for (const txWithStatus of arrayOfTxWithStatus.flat()) {
      if (!txWithStatus) {
        continue
      }

      const {transaction, txStatus} = txWithStatus
      const mappings = mappingsByTxHash.get(transaction.hash)

      for (const {lockHash, address} of mappings) {
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(IndexerTxHashCache)
          .values({
            txHash: transaction.hash,
            blockNumber: transaction.blockNumber,
            blockHash: txStatus.blockHash!,
            blockTimestamp: transaction.timestamp,
            lockHash,
            address,
            walletId: this.walletId,
            isProcessed: false
          })
          .execute()
      }
    }

    return newTxHashes
  }

  public async updateProcessedTxHashes(blockNumber: string) {
    await getConnection()
      .createQueryBuilder()
      .update(IndexerTxHashCache)
      .set({
        isProcessed: true
      })
      .where({
        blockNumber: blockNumber,
        walletId: this.walletId,
      })
      .execute()
  }

  public async nextUnprocessedTxsGroupedByBlockNumber(): Promise<IndexerTxHashCache[]> {
    const cache = await getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        isProcessed: false,
        walletId: this.walletId
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
        walletId: this.walletId
      })
      .getMany()
  }

}

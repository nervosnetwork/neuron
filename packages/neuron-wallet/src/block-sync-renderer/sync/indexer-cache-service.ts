import { getConnection } from 'typeorm'
import AddressMeta from "database/address/meta"
import Script from "models/chain/script"
import IndexerTxHashCache from 'database/chain/entities/indexer-tx-hash-cache'
import RpcService from 'services/rpc-service'


export default class IndexerCacheService {
  private addressMeta: AddressMeta
  private rpcService: RpcService

  constructor(addressMeta: AddressMeta, rpcService: RpcService) {
    this.addressMeta = addressMeta
    this.rpcService = rpcService
  }

  private async countTxHashes(lockScript: Script): Promise<number> {
    return getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        lockHash: lockScript.computeHash()
      })
      .getCount()
  }

  private async getTxHashes(lockScript: Script): Promise<IndexerTxHashCache[]> {
    return getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        lockHash: lockScript.computeHash()
      })
      .getMany()
  }

  public async upsertTxHashes(txHashes: string[], lockScript: Script): Promise<string[]> {
    const txCount = await this.countTxHashes(lockScript)
    if (txHashes.length === txCount) {
      return []
    }
    const txMetasCaches = await this.getTxHashes(lockScript)
    const cachedTxHashes = txMetasCaches.map(meta => meta.txHash.toString())

    const cachedTxHashesSet = new Set(cachedTxHashes);
    const newTxHashes = txHashes.filter(hash => !cachedTxHashesSet.has(hash))

    if (!newTxHashes.length) {
      return []
    }

    const arrayOfTxWithStatus = await Promise.all(
      newTxHashes.map(async hash => {
        const txWithStatus = await this.rpcService.getTransaction(hash)
        if (!txWithStatus) {
          throw new Error(`failed to fetch transaction for hash ${hash}`)
        }
        const blockHeader = await this.rpcService.getHeader(txWithStatus!.txStatus.blockHash!)
        txWithStatus!.transaction.blockNumber = blockHeader?.number
        txWithStatus!.transaction.blockHash = txWithStatus!.txStatus.blockHash!
        txWithStatus!.transaction.timestamp = blockHeader?.timestamp
        return txWithStatus
      })
    )

    for (const {transaction, txStatus} of arrayOfTxWithStatus.flat()) {
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(IndexerTxHashCache)
        .values({
          txHash: transaction.hash,
          blockNumber: transaction.blockNumber,
          blockHash: txStatus.blockHash!,
          blockTimestamp: transaction.timestamp,
          lockHash: lockScript.computeHash(),
          address: this.addressMeta.address,
          isProcessed: false
        })
        .execute()
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
        address: this.addressMeta.address,
      })
      .execute()
  }

  public async nextUnprocessedTxsGroupedByBlockNumber(): Promise<IndexerTxHashCache[]> {
    const cache = await getConnection()
      .getRepository(IndexerTxHashCache)
      .createQueryBuilder()
      .where({
        isProcessed: false,
        address: this.addressMeta.address
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
        address: this.addressMeta.address
      })
      .getMany()
  }

}

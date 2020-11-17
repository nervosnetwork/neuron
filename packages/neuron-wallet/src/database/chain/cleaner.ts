import { getConnection } from 'typeorm'
import InputEntity from './entities/input'
import OutputEntity from './entities/output'
import TransactionEntity from './entities/transaction'
import SyncInfoEntity from './entities/sync-info'
import IndexerTxHashCache from './entities/indexer-tx-hash-cache'

// Clean local sqlite storage
export default class ChainCleaner {
  public static async clean() {
    Promise.all(
      [InputEntity, OutputEntity, TransactionEntity, IndexerTxHashCache].map(entity => {
        return getConnection().getRepository(entity).clear()
      })
    )
    await getConnection().createQueryBuilder()
      .delete()
      .from(SyncInfoEntity)
      .execute()
  }
}

import { getConnection } from 'typeorm'
import InputEntity from './entities/input'
import OutputEntity from './entities/output'
import TransactionEntity from './entities/transaction'
import SyncInfoEntity from './entities/sync-info'

// Clean local sqlite storage
export default class ChainCleaner {
  public static async clean() {
    await Promise.all(
      [InputEntity, OutputEntity, TransactionEntity].map(entity => {
        return getConnection().getRepository(entity).clear()
      })
    )
    await getConnection().createQueryBuilder()
    .delete()
    .from(SyncInfoEntity)
    .where(
      `name != :name`,
      {
        name: SyncInfoEntity.CURRENT_LIVE_CELL_BLOCK_NUMBER,
      }
    )
    .execute()
  }
}

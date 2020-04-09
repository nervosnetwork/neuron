import { getConnection } from 'typeorm'
import InputEntity from './entities/input'
import OutputEntity from './entities/output'
import TransactionEntity from './entities/transaction'
import SyncInfoEntity from './entities/sync-info'

// Clean local sqlite storage
export default class ChainCleaner {
  public static async clean() {
    return Promise.all(
      [InputEntity, OutputEntity, TransactionEntity, SyncInfoEntity].map(entity => {
        return getConnection().getRepository(entity).clear()
      })
    )
  }
}

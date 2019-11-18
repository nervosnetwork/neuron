import { getConnection } from 'typeorm'
import InputEntity from './entities/input'
import OutputEntity from './entities/output'
import TransactionEntity from './entities/transaction'
import SyncInfoEntity from './entities/sync-info'

// Clean local sqlite storage
export default class ChainCleaner {
  public static async clean() {
    for (const entity of [InputEntity, OutputEntity, TransactionEntity, SyncInfoEntity]) {
      await getConnection().getRepository(entity).clear()
    }
  }
}
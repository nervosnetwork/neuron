import { getConnection } from 'typeorm'
import MultisigOutputChangedSubject from '../../models/subjects/multisig-output-db-changed-subject'
import SyncProgressService from '../../services/sync-progress'
import InputEntity from './entities/input'
import OutputEntity from './entities/output'
import TransactionEntity from './entities/transaction'
import SyncInfoEntity from './entities/sync-info'
import IndexerTxHashCache from './entities/indexer-tx-hash-cache'
import MultisigOutput from './entities/multisig-output'

/*
 * Clean local sqlite storage
 */
export const clean = async () => {
  await Promise.all([
    ...[InputEntity, OutputEntity, TransactionEntity, IndexerTxHashCache, MultisigOutput].map(entity => {
      return getConnection()
        .getRepository(entity)
        .clear()
    }),
    SyncProgressService.clearCurrentWalletProgress()
  ])
  MultisigOutputChangedSubject.getSubject().next('reset')

  await getConnection().createQueryBuilder().delete().from(SyncInfoEntity).execute()
}

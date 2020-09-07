// Transaction description is stored in LevelDB separated from Sqlite3 data,
// to keep persisted. Sqlite3 transaction table gets cleaned when user clears
// cache or sync rebuilds txs.

import { getConnection } from 'typeorm'
import TxDescription from 'database/chain/entities/tx-description'

const getEntity = async (walletId: string, txHash: string) => {
  return await getConnection()
    .getRepository(TxDescription)
    .createQueryBuilder()
    .where({walletId, txHash})
    .getOne()
}

export const get = async (walletId: string, txHash: string) => {
  const entity = await getEntity(walletId, txHash)

  if (entity) {
    return entity.description
  }

  return ''
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const set = async (_walletID: string, _txHash: string, _description: string) => {
  const entity = await getEntity(_walletID, _txHash)
  if (entity) {
    entity.description = _description
    await getConnection().manager.save(entity)
    return
  }

  const txDesc = new TxDescription()
  txDesc.walletId = _walletID
  txDesc.txHash = _txHash
  txDesc.description = _description

  await getConnection().manager.save(txDesc)
}

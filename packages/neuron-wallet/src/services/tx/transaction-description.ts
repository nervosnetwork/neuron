import { getConnection } from 'typeorm'
import TxDescription from 'database/chain/entities/tx-description'

const getEntity = async (walletId: string, txHash: string) => {
  return await getConnection()
    .getRepository(TxDescription)
    .createQueryBuilder()
    .where({ walletId, txHash })
    .getOne()
}

export const get = async (walletId: string, txHash: string) => {
  const entity = await getEntity(walletId, txHash)

  if (entity) {
    return entity.description
  }

  return ''
}

export const set = async (walletID: string, txHash: string, description: string) => {
  const entity = await getEntity(walletID, txHash)
  if (entity) {
    entity.description = description
    await getConnection().manager.save(entity)
    return
  }

  const txDesc = new TxDescription()
  txDesc.walletId = walletID
  txDesc.txHash = txHash
  txDesc.description = description

  await getConnection().manager.save(txDesc)
}

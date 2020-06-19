import initDB from "../../src/database/chain/ormconfig"
import { getConnection } from 'typeorm'
import transactions from './transactions'
import accounts from './accounts'
import { TransactionPersistor } from '../../src/services/tx'
import AssetAccount from "../../src/models/asset-account"
import OutputEntity from "../../src/database/chain/entities/output"
import AssetAccountEntity from "../../src/database/chain/entities/asset-account"

export const initConnection = () => {
  return initDB(':memory:')
}

export const closeConnection = () => {
  return getConnection().close()
}

export const loadTransactions = () => {
  return transactions
}

export const saveTransactions = async (txs: any) => {
  for (const tx of txs) {
    // TODO: do not use private methods
    // @ts-ignore: Private method
    await TransactionPersistor.saveWithFetch(tx)
  }
}

export const loadAccounts = () => {
  return accounts
}

export const createAccounts = async (assetAccounts: AssetAccount[], outputEntities: OutputEntity[]) => {
  const entities = assetAccounts.map(aa => AssetAccountEntity.fromModel(aa))
  const accountIds = []
  for (const entity of entities) {
    await getConnection().manager.save([entity.sudtTokenInfo])
    const [assetAccount] = await getConnection().manager.save([entity])
    accountIds.push(assetAccount.id)
  }

  for (const o of outputEntities) {
    await getConnection().manager.save([o.transaction, o])
  }

  return accountIds
}

export const saveAccounts = async () => {
  for (const account of accounts) {
    const entity = AssetAccountEntity.fromModel(account)
    await getConnection().manager.save([entity.sudtTokenInfo, entity])
  }
}

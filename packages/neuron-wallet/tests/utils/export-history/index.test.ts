import path from 'path'
import fs from 'fs'
import os from 'os'
import { getConnection, In } from 'typeorm'
import exportHistory from '../../../src/utils/export-history'
import { formatDatetime } from '../../../src/utils/to-csv-row'
import i18n from '../../../src/locales/i18n'
import TransactionPersistor from '../../../src/services/tx/transaction-persistor'
import { initConnection } from '../../../src/database/chain/ormconfig'
import TransactionEntity from '../../../src/database/chain/entities/transaction'
import Transaction from '../../../src/models/chain/transaction'
import fixtures from './fixtures.json'

describe('Test exporting history', () => {
  beforeAll(async () => {
    i18n.changeLanguage('en')
    await initConnection(":memory:")
    for (const fixture of Object.values(fixtures.transactions)) {
      const tx = Transaction.fromSDK(
        fixture.transaction as any,
        fixture.transaction as any,
      )
      tx.outputs.forEach((o, i) => o.daoData = (fixture.transaction.outputs[i] as any).daoData)
      await TransactionPersistor.saveFetchTx(tx)
    }
  })

  afterAll(() => {
    return getConnection().close()
  })

  it.skip('Test export to csv', async () => {
    // TODO: reuse test cases of TransactionsService#getAllByAddresses
  })
})

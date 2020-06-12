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
  const database = path.join(os.tmpdir(), "neuron_db")
  beforeAll(async () => {
    i18n.changeLanguage('en')
    if (fs.existsSync(database)) {
      try {
        fs.unlinkSync(database)
      } catch {
        console.error("Fail to clear the database")
      }
    }
    await initConnection(database)
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
    if (fs.existsSync(database)) {
      try {
        fs.unlinkSync(database)
      } catch {
        console.error("Fail to clear the database")
      }
    }
  })

  it('Test export to csv', async () => {
    const tmpDir = path.join(os.tmpdir(), 'transaction.csv')
    const connection = getConnection()
    const dbPath = connection.options.database as string
    const lockHashList = [fixtures.transactions.receive.transaction.outputs[0].lockHash]
    await exportHistory({ walletID: '', filePath: tmpDir, lockHashList, dbPath, chainType: "ckb_testnet" })
    const file = fs.readFileSync(tmpDir, 'utf8')
    const datetimes = await connection.
      getRepository(TransactionEntity)
      .find({
        select: ['timestamp', 'hash'],
        where: {
          hash: In([fixtures.transactions.receive.transaction.hash, fixtures.transactions.nervosDao.transaction.hash])
        },
        order: {
          createdAt: "ASC"
        }
      })
      .then(
        (txs: any) => txs.map((tx: any) => { return formatDatetime(new Date(+tx.timestamp)) })
      )

    try {
      fs.unlinkSync(tmpDir)
    } catch (err) {
      console.warn(err)
    }


    const expectedStr = `${fixtures.expected.header}
${datetimes[0]}${fixtures.expected.receive}
${datetimes[1]}${fixtures.expected.nervosDao}
`
    expect(file).toBe(expectedStr)
  })
})

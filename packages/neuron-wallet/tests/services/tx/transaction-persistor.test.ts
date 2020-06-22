import Transaction from "../../../src/models/chain/transaction"
import { TransactionPersistor } from "../../../src/services/tx"
import initConnection from "../../../src/database/chain/ormconfig"
import TransactionEntity from "../../../src/database/chain/entities/transaction"
import { getConnection } from "typeorm"
import transactions from '../../setupAndTeardown/transactions.fixture'

const [tx, tx2] = transactions

describe('TransactionPersistor', () => {
  beforeAll(async done => {
    await initConnection('0x1234')
    done()
  })

  afterAll(async done => {
    await getConnection().close()
    done()
  })

  beforeEach(async done => {
    const connection = getConnection()
    await connection.synchronize(true)
    done()
  })

  describe('saveWithFetch', () => {
    it('multiSignBlake160', async () => {
      const multiSignBlake160 = '0x' + '6'.repeat(40)
      // @ts-ignore: Private method
      await TransactionPersistor.saveWithFetch(tx)
      // @ts-ignore: Private method
      await TransactionPersistor.saveWithFetch(tx2)
      const txDup = Transaction.fromObject({ ...tx })
      txDup.outputs[1].setMultiSignBlake160(multiSignBlake160)
      // @ts-ignore: Private method
      await TransactionPersistor.saveWithFetch(txDup)
      const loadedTx = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.inputs', 'input')
        .leftJoinAndSelect('tx.outputs', 'output')
        .where(`tx.hash = :txHash`, { txHash: txDup.hash! })
        .getOne()
      expect(loadedTx!.inputs[0].multiSignBlake160).toBe(null)
      expect(loadedTx!.outputs[0].multiSignBlake160).toBe(null)
      expect(loadedTx!.outputs[1].multiSignBlake160).toEqual(multiSignBlake160)
      const loadedTx2 = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.inputs', 'input')
        .leftJoinAndSelect('tx.outputs', 'output')
        .where(`tx.hash = :txHash`, { txHash: tx2.hash! })
        .getOne()
      expect(loadedTx2!.inputs[0].multiSignBlake160).toEqual(multiSignBlake160)
      expect(loadedTx2!.outputs[0].multiSignBlake160).toBe(null)
    })
  })
})

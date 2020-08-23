import Transaction from "../../../src/models/chain/transaction"
import { TransactionPersistor, TxSaveType } from "../../../src/services/tx"
import initConnection from "../../../src/database/chain/ormconfig"
import TransactionEntity from "../../../src/database/chain/entities/transaction"
import { getConnection } from "typeorm"
import transactions from '../../setupAndTeardown/transactions.fixture'

const [tx, tx2] = transactions

describe('TransactionPersistor', () => {
  beforeAll(async () => {
    await initConnection('')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)
  })

  describe('#convertTransactionAndSave', () => {
    describe('saves a transaction', () => {
      const multiSignBlake160 = '0x' + '6'.repeat(40)
      beforeEach(async () => {
        await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Fetch)
      });

      describe('when saved another transaction consuming an input from the previous transaction', () => {
        beforeEach(async () => {
          expect(tx.outputs[1].outPoint).toEqual(tx2.inputs[0].previousOutput)
          await TransactionPersistor.convertTransactionAndSave(tx2, TxSaveType.Fetch)
        });

        describe('when updated an output of the previous transaction', () => {
          const txDup = Transaction.fromObject({ ...tx })
          beforeEach(async () => {
            txDup.outputs[1].setMultiSignBlake160(multiSignBlake160)
            await TransactionPersistor.convertTransactionAndSave(txDup, TxSaveType.Fetch)
          })
          it('updates both transactions', async () => {
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
        });
      });
    });
  })
})

import Transaction from '../../../src/models/chain/transaction'
import { TransactionPersistor, TxSaveType } from '../../../src/services/tx'
import initConnection from '../../../src/database/chain/ormconfig'
import TransactionEntity from '../../../src/database/chain/entities/transaction'
import { getConnection } from 'typeorm'
import transactions from '../../setupAndTeardown/transactions.fixture'
import AssetAccountInfo from '../../../src/models/asset-account-info'
import SystemScriptInfo from '../../../src/models/system-script-info'
import Multisig from '../../../src/models/multisig'
import TxLockEntity from '../../../src/database/chain/entities/tx-lock'

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
      })

      describe('when saved another transaction consuming an input from the previous transaction', () => {
        beforeEach(async () => {
          expect(tx.outputs[1].outPoint).toEqual(tx2.inputs[0].previousOutput)
          await TransactionPersistor.convertTransactionAndSave(tx2, TxSaveType.Fetch)
        })

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
        })
      })
    })
  })

  describe('#convertTransactionAndSave with lockargs', () => {
    beforeEach(async () => {
      const connection = getConnection()
      await connection.synchronize(true)
    })
    it('filter not current args', async () => {
      await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Fetch, new Set([tx.outputs[0].lock.args]))
      const loadedTx = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.inputs', 'input')
        .leftJoinAndSelect('tx.outputs', 'output')
        .where(`tx.hash = :txHash`, { txHash: tx.hash })
        .getOne()
      expect(loadedTx?.inputs.length).toBe(0)
      expect(loadedTx?.outputs.length).toBe(1)
      expect(loadedTx?.outputs[0].lockArgs).toBe(tx.outputs[0].lock.args)
      const txLocks = await getConnection()
        .getRepository(TxLockEntity)
        .find({ transactionHash: tx.hash })
      expect(txLocks.length).toBe(1)
      expect(txLocks[0].lockHash).toBe(tx.inputs[0].lock?.computeHash())
    })
    it('all args is current', async () => {
      const args = [...tx.inputs.map(v => v.lock?.args), ...tx.outputs.map(v => v.lock.args)].filter((v): v is string => !!v)
      await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Fetch, new Set(args))
      const loadedTx = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.inputs', 'input')
        .leftJoinAndSelect('tx.outputs', 'output')
        .where(`tx.hash = :txHash`, { txHash: tx.hash })
        .getOne()
      expect(loadedTx?.inputs.length).toBe(1)
      expect(loadedTx?.outputs.length).toBe(2)
      const txLocks = await getConnection()
        .getRepository(TxLockEntity)
        .find({ transactionHash: tx.hash })
      expect(txLocks.length).toBe(0)
    })
    it('filter with receive cheque and send cheque', async () => {
      const assetAccountInfo = new AssetAccountInfo()
      const txWithCheque = Transaction.fromObject(tx)
      const outputReceiveChequeLock = assetAccountInfo.generateChequeScript(txWithCheque.outputs[0].lockHash, `0x${'0'.repeat(42)}`)
      const outputSendChequeLock = assetAccountInfo.generateChequeScript(`0x${'0'.repeat(42)}`, txWithCheque.outputs[0].lockHash)
      txWithCheque.outputs[0].setLock(outputReceiveChequeLock)
      txWithCheque.outputs[1].setLock(outputSendChequeLock)
      const args = [...tx.inputs.map(v => v.lock?.args), ...tx.outputs.map(v => v.lock.args)].filter((v): v is string => !!v).map(v => [
        v,
        SystemScriptInfo.generateSecpScript(v).computeHash().slice(0, 42),
      ]).flat()
      await TransactionPersistor.convertTransactionAndSave(txWithCheque, TxSaveType.Fetch, new Set(args))
      const loadedTx = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.inputs', 'input')
        .leftJoinAndSelect('tx.outputs', 'output')
        .where(`tx.hash = :txHash`, { txHash: tx.hash })
        .getOne()
      expect(loadedTx?.inputs.length).toBe(1)
      expect(loadedTx?.outputs.length).toBe(2)
      const txLocks = await getConnection()
        .getRepository(TxLockEntity)
        .find({ transactionHash: tx.hash })
      expect(txLocks.length).toBe(0)
    })
    it('filter with multi lock time', async () => {
      const txWithCheque = Transaction.fromObject(tx)
      const multisigLockTimeLock = SystemScriptInfo.generateMultiSignScript(Multisig.hash([txWithCheque.outputs[0].lock.args]))
      txWithCheque.outputs[0].setLock(multisigLockTimeLock)
      const args = [...tx.inputs.map(v => v.lock?.args), ...tx.outputs.map(v => v.lock.args)].filter((v): v is string => !!v).map(v => [
        v,
        Multisig.hash([v]),
      ]).flat()
      await TransactionPersistor.convertTransactionAndSave(txWithCheque, TxSaveType.Fetch, new Set(args))
      const loadedTx = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.inputs', 'input')
        .leftJoinAndSelect('tx.outputs', 'output')
        .where(`tx.hash = :txHash`, { txHash: tx.hash })
        .getOne()
      expect(loadedTx?.inputs.length).toBe(1)
      expect(loadedTx?.outputs.length).toBe(2)
      const txLocks = await getConnection()
        .getRepository(TxLockEntity)
        .find({ transactionHash: tx.hash })
      expect(txLocks.length).toBe(0)
    })
  })
})

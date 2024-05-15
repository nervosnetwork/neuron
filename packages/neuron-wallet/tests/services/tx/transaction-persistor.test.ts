import Transaction, { TransactionStatus } from '../../../src/models/chain/transaction'
import { TransactionPersistor, TxSaveType } from '../../../src/services/tx'
import TransactionEntity from '../../../src/database/chain/entities/transaction'
import transactions from '../../setupAndTeardown/transactions.fixture'
import AssetAccountInfo from '../../../src/models/asset-account-info'
import SystemScriptInfo from '../../../src/models/system-script-info'
import Multisig from '../../../src/models/multisig'
import TxLockEntity from '../../../src/database/chain/entities/tx-lock'
import { OutputStatus } from '../../../src/models/chain/output'
import OutputEntity from '../../../src/database/chain/entities/output'
import HdPublicKeyInfo from '../../../src/database/chain/entities/hd-public-key-info'
import InputEntity from '../../../src/database/chain/entities/input'
import { closeConnection, getConnection, initConnection } from '../../setupAndTeardown'

const [tx, tx2] = transactions

describe('TransactionPersistor', () => {
  beforeAll(async () => {
    await initConnection()
  })

  afterAll(async () => {
    await closeConnection()
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
      const txLocks = await getConnection().getRepository(TxLockEntity).findBy({ transactionHash: tx.hash })
      expect(txLocks.length).toBe(1)
      expect(txLocks[0].lockHash).toBe(tx.inputs[0].lock?.computeHash())
    })
    it('all args is current', async () => {
      const args = [...tx.inputs.map(v => v.lock?.args), ...tx.outputs.map(v => v.lock.args)].filter(
        (v): v is string => !!v
      )
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
      const txLocks = await getConnection().getRepository(TxLockEntity).findBy({ transactionHash: tx.hash })
      expect(txLocks.length).toBe(0)
    })
    it('filter with receive cheque and send cheque', async () => {
      const assetAccountInfo = new AssetAccountInfo()
      const txWithCheque = Transaction.fromObject(tx)
      const outputReceiveChequeLock = assetAccountInfo.generateChequeScript(
        txWithCheque.outputs[0].lockHash,
        `0x${'0'.repeat(42)}`
      )
      const outputSendChequeLock = assetAccountInfo.generateChequeScript(
        `0x${'0'.repeat(42)}`,
        txWithCheque.outputs[0].lockHash
      )
      txWithCheque.outputs[0].setLock(outputReceiveChequeLock)
      txWithCheque.outputs[1].setLock(outputSendChequeLock)
      const args = [...tx.inputs.map(v => v.lock?.args), ...tx.outputs.map(v => v.lock.args)]
        .filter((v): v is string => !!v)
        .map(v => [v, SystemScriptInfo.generateSecpScript(v).computeHash().slice(0, 42)])
        .flat()
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
      const txLocks = await getConnection().getRepository(TxLockEntity).findBy({ transactionHash: tx.hash })
      expect(txLocks.length).toBe(0)
    })
    it('filter with multi lock time', async () => {
      const txWithCheque = Transaction.fromObject(tx)
      const multisigLockTimeLock = SystemScriptInfo.generateMultiSignScript(
        Multisig.hash([txWithCheque.outputs[0].lock.args])
      )
      txWithCheque.outputs[0].setLock(multisigLockTimeLock)
      const args = [...tx.inputs.map(v => v.lock?.args), ...tx.outputs.map(v => v.lock.args)]
        .filter((v): v is string => !!v)
        .map(v => [v, Multisig.hash([v])])
        .flat()
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
      const txLocks = await getConnection().getRepository(TxLockEntity).findBy({ transactionHash: tx.hash })
      expect(txLocks.length).toBe(0)
    })
  })

  describe('#saveWithSent', () => {
    const createMock = jest.fn()
    const originalCreate = TransactionPersistor.create
    beforeAll(() => {
      TransactionPersistor.create = createMock
    })
    afterAll(() => {
      TransactionPersistor.create = originalCreate
    })
    afterEach(async () => {
      await getConnection().synchronize(true)
      createMock.mockReset()
    })

    it('there is no transaction', async () => {
      //@ts-ignore private method
      await TransactionPersistor.saveWithSent(tx)
      expect(createMock).toBeCalledWith(tx, OutputStatus.Sent, OutputStatus.Pending)
    })
    it('there is a transaction but status is failed', async () => {
      const entity = new TransactionEntity()
      entity.hash = tx.hash || tx.computeHash()
      entity.version = tx.version
      entity.headerDeps = tx.headerDeps
      entity.cellDeps = tx.cellDeps
      entity.timestamp = tx.timestamp!
      entity.blockHash = tx.blockHash!
      entity.blockNumber = tx.blockNumber!
      entity.witnesses = tx.witnessesAsString()
      entity.description = '' // tx desc is saved in leveldb as wallet property
      entity.status = TransactionStatus.Failed
      entity.inputs = []
      entity.outputs = []
      await getConnection().manager.save(entity)
      //@ts-ignore private method
      await TransactionPersistor.saveWithSent(tx)
      expect(createMock).toBeCalledWith(tx, OutputStatus.Sent, OutputStatus.Pending)
    })
    it('there is a transaction but status is not failed', async () => {
      await originalCreate(tx, OutputStatus.Dead, OutputStatus.Dead)
      //@ts-ignore private method
      await TransactionPersistor.saveWithSent(tx)
      expect(createMock).toBeCalledTimes(0)
    })
  })

  describe('#saveWithFetch', () => {
    const createMock = jest.fn()
    const originalCreate = TransactionPersistor.create
    beforeAll(() => {
      TransactionPersistor.create = createMock
    })
    afterAll(() => {
      TransactionPersistor.create = originalCreate
    })
    afterEach(async () => {
      await getConnection().synchronize(true)
      createMock.mockReset()
    })

    it('there is no transaction', async () => {
      //@ts-ignore private method
      await TransactionPersistor.saveWithFetch(tx)
      expect(createMock).toBeCalledWith(tx, OutputStatus.Live, OutputStatus.Dead, undefined)
    })
    it('update sent output to live', async () => {
      const entity = await originalCreate(tx, OutputStatus.Sent, OutputStatus.Pending)
      expect(entity.outputs[0]?.status).toBe(OutputStatus.Sent)
      //@ts-ignore private method
      await TransactionPersistor.saveWithFetch(tx)
      expect(createMock).toBeCalledTimes(0)
      const output = await getConnection().getRepository(OutputEntity).findOneBy({ outPointTxHash: entity.hash })
      expect(output?.status).toBe(OutputStatus.Live)
    })
    it('update live output to dead because refer to input', async () => {
      const entity = await originalCreate(tx, OutputStatus.Live, OutputStatus.Dead)
      expect(entity.outputs[0]?.status).toBe(OutputStatus.Live)
      await originalCreate(tx2, OutputStatus.Sent, OutputStatus.Pending)
      //@ts-ignore private method
      await TransactionPersistor.saveWithFetch(tx2)
      const output = await getConnection().getRepository(OutputEntity).findOneBy({
        outPointTxHash: tx2.inputs[0].previousOutput?.txHash,
        outPointIndex: tx2.inputs[0].previousOutput?.index,
      })
      expect(output?.status).toBe(OutputStatus.Dead)
    })
  })

  describe('#create', () => {
    afterEach(async () => {
      await getConnection().synchronize(true)
    })
    it('set output to dead if it is in input', async () => {
      await TransactionPersistor.convertTransactionAndSave(tx2, TxSaveType.Sent)
      await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Sent)
      const output = await getConnection().getRepository(OutputEntity).findOneBy({
        outPointTxHash: tx2.inputs[0].previousOutput?.txHash,
        outPointIndex: tx2.inputs[0].previousOutput?.index,
      })
      expect(output?.status).toBe(OutputStatus.Dead)
    })
  })

  describe('#checkTxLock', () => {
    afterEach(async () => {
      await getConnection().synchronize(true)
    })

    it('no tx lock saving wrong', async () => {
      const mock = jest.fn()
      jest.doMock('typeorm', () => ({
        getConnection() {
          return { createQueryRunner: mock }
        },
      }))
      await TransactionPersistor.checkTxLock()
      expect(mock).toBeCalledTimes(0)
    })

    it('some tx lock saving wrong', async () => {
      const txLocks = TxLockEntity.fromObject({
        txHash: tx.hash!,
        lockHash: tx.inputs[0].lockHash!,
        lockArgs: tx.inputs[0].lock!.args!,
      })
      const hdPublicKeyInfo = HdPublicKeyInfo.fromObject({
        walletId: 'w1',
        addressType: 0,
        addressIndex: 0,
        publicKeyInBlake160: tx.inputs[0].lock!.args!,
      })
      await getConnection().manager.save([txLocks, hdPublicKeyInfo])
      await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Sent)
      let output = await getConnection().getRepository(OutputEntity).findOneBy({ outPointTxHash: tx.hash })
      let input = await getConnection().getRepository(InputEntity).findOneBy({ transactionHash: tx.hash })
      expect(output).toBeDefined()
      expect(input).toBeDefined()
      await TransactionPersistor.checkTxLock()
      output = await getConnection().getRepository(OutputEntity).findOneBy({ outPointTxHash: tx.hash })
      input = await getConnection().getRepository(InputEntity).findOneBy({ transactionHash: tx.hash })
      expect(output).toBeNull()
      expect(input).toBeNull()
    })
  })

  describe('#findAndCreateTxLocks', () => {
    let inputEntities: InputEntity[] = []
    let outputEntities: OutputEntity[] = []
    beforeAll(async () => {
      await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Sent)
      inputEntities = await getConnection().getRepository(InputEntity).findBy({ transactionHash: tx.hash })
      outputEntities = await getConnection().getRepository(OutputEntity).findBy({ outPointTxHash: tx.hash })
    })
    it('no filter', () => {
      const cells = [...inputEntities, ...outputEntities]
      //@ts-ignore private method
      const result = TransactionPersistor.findAndCreateTxLocks(cells, new Set(), tx.hash!)
      expect(result).toHaveLength(new Set(cells.map(v => v.lockHash!)).size)
    })
    it('filter with lock args', () => {
      const cells = [...inputEntities, ...outputEntities]
      //@ts-ignore private method
      const result = TransactionPersistor.findAndCreateTxLocks(cells, new Set([tx.inputs[0].lock?.args]), tx.hash!)
      expect(result).toHaveLength(1)
    })
  })
})

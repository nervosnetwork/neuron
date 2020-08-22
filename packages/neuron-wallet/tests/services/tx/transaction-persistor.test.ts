// @ts-nocheck
import Transaction from "../../../src/models/chain/transaction"
import { TransactionPersistor, TxSaveType } from "../../../src/services/tx"
import initConnection from "../../../src/database/chain/ormconfig"
import TransactionEntity from "../../../src/database/chain/entities/transaction"
import { getConnection } from "typeorm"
import transactions from '../../setupAndTeardown/transactions.fixture'
import HdPublicKeyInfo from "../../../src/database/chain/entities/hd-public-key-info"

const [tx, tx2] = transactions

const createPublicKeys = async (walletId: string, publicKeys: string[]) => {
  const publicKeyInfos = []
  for (let i = 0; i < publicKeys.length; i++) {
    const keyInfo = new HdPublicKeyInfo()
    keyInfo.walletId = walletId
    keyInfo.path = `m/44'/309'/0'/0/${i}`
    keyInfo.address = `ckt100000000000000000000000000000000000000000${i}`
    keyInfo.addressType = 1
    keyInfo.addressIndex = i
    keyInfo.publicKeyInBlake160 = publicKeys[i]
    publicKeyInfos.push(keyInfo)
  }
  await getConnection().createQueryRunner().manager.save(publicKeyInfos)
}

describe('TransactionPersistor', () => {
  const fakeWalletId1 = 'w1'
  const fakeWalletId2 = 'w2'

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
    const publicKeyHash1 = tx.inputs[0]!.lock!.args
    const publicKeyHash2 = tx.outputs[0]!.lock!.args
    const publicKeyHash3 = tx2.outputs[0]!.lock!.args
    beforeEach(async () => {
      expect(publicKeyHash1).not.toEqual(publicKeyHash2)
      expect(publicKeyHash2).not.toEqual(publicKeyHash3)
      await createPublicKeys(fakeWalletId1, [publicKeyHash1, publicKeyHash2])
      await createPublicKeys(fakeWalletId2, [publicKeyHash1, publicKeyHash3])
    });
    describe('saves a transaction', () => {
      const multiSignBlake160 = '0x' + '6'.repeat(40)
      beforeEach(async () => {
        await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Fetch)
      });

      it('updates used public keys relating the inputs/outputs in the persisted transaction', async () => {
        const publicKeyInfos = await getConnection()
          .getRepository(HdPublicKeyInfo)
          .createQueryBuilder()
          .getMany()

        expect(publicKeyInfos.length).toEqual(4)
        expect(publicKeyInfos[0].used).toEqual(true)
        expect(publicKeyInfos[1].used).toEqual(true)
        expect(publicKeyInfos[2].used).toEqual(true)

        expect(publicKeyInfos[3].publicKeyInBlake160).toEqual(publicKeyHash3)
        expect(publicKeyInfos[3].used).toEqual(false)
      })

      describe('when saved another transaction consuming an input from the previous transaction', () => {
        beforeEach(async () => {
          expect(tx.outputs[1].outPoint).toEqual(tx2.inputs[0].previousOutput)
          await TransactionPersistor.convertTransactionAndSave(tx2, TxSaveType.Fetch)
        });

        it('updates used public keys', async () => {
          const publicKeyInfos = await getConnection()
            .getRepository(HdPublicKeyInfo)
            .createQueryBuilder()
            .getMany()

          expect(publicKeyInfos[3].publicKeyInBlake160).toEqual(publicKeyHash3)
          expect(publicKeyInfos[3].used).toEqual(true)
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

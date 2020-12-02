import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import mockedTransactions from '../setupAndTeardown/transactions.fixture'
import { TransactionStatus } from '../../src/models/chain/transaction'
import TransactionPersistor from '../../src/services/tx/transaction-persistor'
import { OutputStatus } from '../../src/models/chain/output'
import TxStatus, {TxStatusType} from '../../src/models/chain/tx-status'
import TransactionEntity from '../../src/database/chain/entities/transaction'

const stubbedRPCServiceConstructor = jest.fn()
const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()
const stubbedRxJsIntervalFn = jest.fn()

const resetMocks = () => {
  stubbedGetTransactionFn.mockReset()
  stubbedRxJsIntervalFn.mockReset()
}

stubbedRPCServiceConstructor.mockImplementation(
  () => ({
    getTransaction: stubbedGetTransactionFn,
    getHeader: stubbedGetHeaderFn,
  })
)

jest.doMock('services/rpc-service', () => {
  return stubbedRPCServiceConstructor
});
jest.doMock('rxjs', () => {
  return {
    __esModule: true,
    interval: stubbedRxJsIntervalFn,
    ReplaySubject: jest.fn(),
    Subject: jest.fn(),
    BehaviorSubject: jest.fn(),
  }
});

const {register} = require('../../src/block-sync-renderer/tx-status-listener')

describe('', () => {
  beforeAll(async () => {
    await initConnection('')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    resetMocks()
    jest.useFakeTimers()
  })

  describe('#register', () => {
    let trackingStatus: any
    const [tx1] = mockedTransactions

    beforeEach(() => {
      stubbedRxJsIntervalFn.mockReturnValue({
        pipe: () => ({
          subscribe: (_callback: any) => {
            trackingStatus = _callback
          }
        })
      })
    });

    describe('when there are pending txs', () => {
      beforeEach(async () => {
        tx1.status = TransactionStatus.Pending

        await TransactionPersistor.create(tx1, OutputStatus.Sent, OutputStatus.Sent)
        stubbedGetHeaderFn.mockResolvedValue({})
      })
      describe('with committed status', () => {
        beforeEach(async () => {
          const txStatus = new TxStatus('', TxStatusType.Committed)
          stubbedGetTransactionFn.mockResolvedValue({
            transaction: tx1,
            txStatus
          })

          register()
          await trackingStatus()
        });
        it('updates tx status to success', async () => {
          const txs = await getConnection()
            .getRepository(TransactionEntity)
            .find()
          expect(txs[0].status).toEqual('success')
        });
      });
      describe('with pending status', () => {
        beforeEach(async () => {
          const txStatus = new TxStatus('', TxStatusType.Pending)
          stubbedGetTransactionFn.mockResolvedValue({
            transaction: tx1,
            txStatus
          })

          register()
          await trackingStatus()
        });
        it('tx status remains pending', async () => {
          const txs = await getConnection()
            .getRepository(TransactionEntity)
            .find()
          expect(txs[0].status).toEqual('pending')
        });
      });
      describe('with no transaction returned from rpc', () => {
        beforeEach(async () => {
          register()
          await trackingStatus()
        });
        it('updates tx status to failed', async () => {
          const txs = await getConnection()
            .getRepository(TransactionEntity)
            .find()
          expect(txs[0].status).toEqual('failed')
        });
      });
    });
    describe('when there are no pending txs', () => {
      beforeEach(async () => {
        register()
        await trackingStatus()
      });
      it('should not proceed', () => {
        expect(stubbedGetTransactionFn).toHaveBeenCalledTimes(0)
      })
    })
  });
});

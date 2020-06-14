import path from 'path'
import AddressGenerator from "../../src/models/address-generator"
import { AddressPrefix } from '../../src/models/keys/address'
import SystemScriptInfo from '../../src/models/system-script-info'
import IndexerConnector from '../../src/block-sync-renderer/sync/indexer-connector'

const stubbedStartForeverFn = jest.fn()
const stubbedTipFn = jest.fn()
const stubbedGetTransactionsByLockScriptFn = jest.fn()
const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()

const stubbedIndexerConstructor = jest.fn().mockImplementation(
  () => ({
    startForever: stubbedStartForeverFn,
    tip: stubbedTipFn,
    getTransactionsByLockScript: stubbedGetTransactionsByLockScriptFn
  })
)

const stubbedRPCServiceConstructor = jest.fn().mockImplementation(
  () => ({
    getTransaction: stubbedGetTransactionFn,
    getHeader: stubbedGetHeaderFn
  })
)

const resetMocks = () => {
  stubbedTipFn.mockReset()
  stubbedStartForeverFn.mockReset()
  stubbedGetTransactionFn.mockReset()
  stubbedGetHeaderFn.mockReset()
  stubbedGetTransactionsByLockScriptFn.mockReset()
}

const connectIndexer = async (indexerConnector: IndexerConnector) => {
  indexerConnector.connect()
  await Promise.resolve()
}

describe('unit tests for IndexerConnector', () => {
  const nodeUrl = 'http://nodeurl:8114'
  const indexerFolderPath = '/indexer/data/path'
  let stubbedIndexerConnector: any
  beforeEach(() => {
    jest.doMock('@ckb-lumos/indexer', () => {
      return {
        Indexer : stubbedIndexerConstructor
      }
    });
    jest.doMock('services/rpc-service', () => {
      return stubbedRPCServiceConstructor
    });
    stubbedIndexerConnector = require('../../src/block-sync-renderer/sync/indexer-connector').default
    resetMocks()
    jest.useFakeTimers()
  });
  afterEach(() => {
    jest.clearAllTimers()
  });

  describe('#constructor', () => {
    describe('when success', () => {
      beforeEach(() => {
        new stubbedIndexerConnector([], nodeUrl, indexerFolderPath)
      });
      it('init with a node url and indexer folder path', () => {
        expect(stubbedIndexerConstructor).toHaveBeenCalledWith(nodeUrl, path.join(indexerFolderPath))
      });
    });
    describe('when failed', () => {
      it('throws an error when failed to init indexer folder', () => {

      });
      it('throws an error when failed to start indexer', () => {

      })
    })
  });
  describe('#connect', () => {
    const fakeTip1 = {block_number: '1', block_hash: 'hash1'}
    const fakeTip2 = {block_number: '2', block_hash: 'hash2'}
    const fakeBlock1 = {number: '1', hash: '1', timestamp: '1'}
    const fakeBlock2 = {number: '2', hash: '2', timestamp: '2'}
    const fakeTx1 = {transaction: {hash: 'hash1', blockNumber: fakeBlock1.number}, txStatus: {status: 'committed', blockHash: fakeBlock1.hash}}
    const fakeTx2 = {transaction: {hash: 'hash2', blockNumber: fakeBlock2.number}, txStatus: {status: 'committed', blockHash: fakeBlock2.hash}}
    const fakeTx3 = {transaction: {hash: 'hash3', blockNumber: fakeBlock2.number}, txStatus: {status: 'committed', blockHash: fakeBlock2.hash}}

    let indexerConnector: IndexerConnector
    beforeEach(() => {
      stubbedTipFn.mockReturnValueOnce(fakeTip1)
      stubbedTipFn.mockReturnValueOnce(fakeTip2)

      const shortAddressInfo = {
        lock: SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c'),
      }
      const address = AddressGenerator.toShort(shortAddressInfo.lock, AddressPrefix.Testnet)
      const addressesToWatch = [address, address]
      indexerConnector = new stubbedIndexerConnector(addressesToWatch, '', '')
    });
    it('starts indexer', async () => {
      stubbedGetTransactionFn.mockReturnValue(fakeTx1)
      stubbedGetTransactionsByLockScriptFn.mockReturnValue([fakeTx1.transaction.hash])
      await connectIndexer(indexerConnector)
      expect(stubbedStartForeverFn).toHaveBeenCalled()
    });
    describe('polls for new data', () => {
      describe('#transactionsSubject', () => {
        let transactionsSubject: any
        beforeEach(() => {
          transactionsSubject = indexerConnector.transactionsSubject
        });
        describe('check if new transactions are available for an address', () => {
          //Use ckb-indexer's last cursor to facilitate
          describe('when there are no new transactions', () => {
            let txObserver: any
            beforeEach(async () => {
              stubbedGetTransactionsByLockScriptFn.mockReturnValue([])
              txObserver = jest.fn()
              transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
              await connectIndexer(indexerConnector)
            });
            it('should not emit new transactions for the address', () => {
              expect(txObserver).toHaveBeenCalledTimes(0)
            })
          });
          describe('when there are new transactions', () => {
            let txObserver: any
            beforeEach(async () => {
              stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([fakeTx1.transaction.hash, fakeTx2.transaction.hash])
              stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([fakeTx3.transaction.hash])
              stubbedGetTransactionFn.mockReturnValueOnce(fakeTx1)
              stubbedGetTransactionFn.mockReturnValueOnce(fakeTx2)
              stubbedGetTransactionFn.mockReturnValueOnce(fakeTx3)
              stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock1)
              stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)
              stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)

              txObserver = jest.fn()
              transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
              await connectIndexer(indexerConnector)
            });
            it('emits new transactions in batch by block number', async () => {
              expect(txObserver).toHaveBeenCalledWith([fakeTx1])
              expect(txObserver).toHaveBeenCalledWith([fakeTx2, fakeTx3])
            });
          });
        });
      });
      describe('#blockTipSubject', () => {
        let tipObserver: any
        beforeEach(async () => {
          tipObserver = jest.fn()
          indexerConnector.blockTipSubject.subscribe(tip => {
            tipObserver(tip)
          })
          stubbedGetTransactionFn.mockReturnValue(fakeTx3)
          stubbedGetTransactionsByLockScriptFn.mockReturnValue([fakeTx3.transaction.hash])
          await connectIndexer(indexerConnector)
        });
        describe('when the block tip is higher than previous one', () => {
          it('observed new tips', async () => {
            for (let second = 1; second <= 1; second++) {
              jest.advanceTimersByTime(5000)
              await Promise.resolve()
            }
            expect(tipObserver).toHaveBeenCalledWith(fakeTip1)
            expect(tipObserver).toHaveBeenCalledWith(fakeTip2)
          })
        });
      });
      describe('when the block tip is less or equal to previous one', () => {
        it('should not emit new block tip', () => {

        })
      });
    })
  });
  describe('#unsubscribeAll()', () => {
    it('unsubscribe for an address', () => {

    })
  });
  describe('#stop', () => {

  });
  describe('#clearIndexerData', () => {
    it('deletes the indexer data folder based on the current mode environment', () => {

    })
  });
});

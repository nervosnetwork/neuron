import path from 'path'
import AddressGenerator from "../../src/models/address-generator"
import { AddressPrefix, AddressType } from '../../src/models/keys/address'
import { Address, AddressVersion } from '../../src/database/address/address-dao'
import SystemScriptInfo from '../../src/models/system-script-info'
import IndexerConnector from '../../src/block-sync-renderer/sync/indexer-connector'
import AddressMeta from '../../src/database/address/meta'

const stubbedStartForeverFn = jest.fn()
const stubbedTipFn = jest.fn()
const stubbedGetTransactionsByLockScriptFn = jest.fn()
const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()
const stubbedUpsertTxHashesFn = jest.fn()
const stubbedNextUnprocessedTxsGroupedByBlockNumberFn = jest.fn()
const stubbedLoggerErrorFn = jest.fn()

const stubbedIndexerConstructor = jest.fn().mockImplementation(
  () => ({
    startForever: stubbedStartForeverFn,
    tip: stubbedTipFn,
    getTransactionsByLockScript: stubbedGetTransactionsByLockScriptFn
  })
)

const stubbedIndexerCacheService = jest.fn().mockImplementation(
  () => ({
    upsertTxHashes: stubbedUpsertTxHashesFn,
    nextUnprocessedTxsGroupedByBlockNumber: stubbedNextUnprocessedTxsGroupedByBlockNumberFn,
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
  stubbedUpsertTxHashesFn.mockReset()
  stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReset()
  stubbedLoggerErrorFn.mockReset()
}

const flushPromises = () => new Promise(setImmediate);

const connectIndexer = async (indexerConnector: IndexerConnector) => {
  const connectPromise = indexerConnector.connect()
  const errSpy = jest.fn()
  connectPromise.catch(err => {
    errSpy(err)
  })
  await flushPromises()
  return errSpy
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
    jest.doMock('electron-log', () => {
      return {error: stubbedLoggerErrorFn}
    });
    jest.doMock('../../src/block-sync-renderer/sync/indexer-cache-service', () => {
      return stubbedIndexerCacheService
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
    const fakeTx1 = {
      transaction: {hash: 'hash1', blockNumber: fakeBlock1.number, blockTimestamp: new Date(1)},
      txStatus: {status: 'committed', blockHash: fakeBlock1.hash}
    }
    const fakeTx2 = {
      transaction: {hash: 'hash2', blockNumber: fakeBlock2.number, blockTimestamp: new Date(2)},
      txStatus: {status: 'committed', blockHash: fakeBlock2.hash}
    }
    const fakeTx3 = {
      transaction: {hash: 'hash3', blockNumber: fakeBlock2.number, blockTimestamp: new Date(3)},
      txStatus: {status: 'committed', blockHash: fakeBlock2.hash}
    }

    const fakeTxHashCache1 = {
      txHash: fakeTx1.transaction.hash, blockNumber: fakeTx1.transaction.blockNumber, blockTimestamp: fakeTx1.transaction.blockTimestamp
    }
    const fakeTxHashCache2 = {
      txHash: fakeTx2.transaction.hash, blockNumber: fakeTx2.transaction.blockNumber, blockTimestamp: fakeTx2.transaction.blockTimestamp
    }
    const fakeTxHashCache3 = {
      txHash: fakeTx3.transaction.hash, blockNumber: fakeTx3.transaction.blockNumber, blockTimestamp: fakeTx3.transaction.blockTimestamp
    }

    let indexerConnector: IndexerConnector
    const shortAddressInfo = {
      lock: SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c'),
    }
    const address = AddressGenerator.toShort(shortAddressInfo.lock, AddressPrefix.Testnet)
    const addressObj: Address = {
      address,
      blake160: '0x',
      walletId: '',
      path: '',
      addressType: AddressType.Receiving,
      addressIndex: 0,
      txCount: 0,
      liveBalance: '',
      sentBalance: '',
      pendingBalance: '',
      balance: '',
      version: AddressVersion.Testnet
    }
    const addressesToWatch = [addressObj, addressObj]

    beforeEach(() => {
      stubbedTipFn.mockReturnValueOnce(fakeTip1)
      stubbedTipFn.mockReturnValueOnce(fakeTip2)

      indexerConnector = new stubbedIndexerConnector(addressesToWatch, '', '')
    });
    describe('starts lumos indexer', () => {
      beforeEach(async () => {
        stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValue([])
        await connectIndexer(indexerConnector)
        expect(stubbedLoggerErrorFn).toHaveBeenCalledTimes(0)
      });
      it('starts indexer', async () => {
        expect(stubbedStartForeverFn).toHaveBeenCalled()
      });
    });
    describe('polls for new data', () => {
      describe('#transactionsSubject', () => {
        let transactionsSubject: any
        beforeEach(() => {
          transactionsSubject = indexerConnector.transactionsSubject
        });

        describe('when there are transactions for an address', () => {
          let txObserver: any
          beforeEach(() => {
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
          });
          describe('when loaded block number is already in order', () => {
            beforeEach(async () => {
              stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValueOnce([
                fakeTxHashCache1,
                fakeTxHashCache2,
              ])
              stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValueOnce([
                fakeTxHashCache3
              ])

              await connectIndexer(indexerConnector)
            });
            it('upserts tx hash caches', () => {
              expect(stubbedUpsertTxHashesFn).toHaveBeenCalledWith(
                [fakeTx1.transaction.hash, fakeTx2.transaction.hash],
                AddressMeta.fromObject(addressObj).generateDefaultLockScript()
              )
              expect(stubbedUpsertTxHashesFn).toHaveBeenCalledWith(
                [fakeTx3.transaction.hash],
                AddressMeta.fromObject(addressObj).generateDefaultLockScript()
              )
            })
            it('emits new transactions in batch by the next unprocessed block number', () => {
              expect(txObserver).toHaveBeenCalledTimes(1)
              expect(txObserver).toHaveBeenCalledWith([fakeTx1])
            });
          });
          describe('when loaded block number is not in order', () => {
            beforeEach(async () => {
              stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValueOnce([
                fakeTxHashCache3
              ])
              stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValueOnce([
                fakeTxHashCache1,
                fakeTxHashCache2
              ])

              await connectIndexer(indexerConnector)
            });
            it('upserts tx hash caches', () => {
              expect(stubbedUpsertTxHashesFn).toHaveBeenCalledWith(
                [fakeTx1.transaction.hash, fakeTx2.transaction.hash],
                AddressMeta.fromObject(addressObj).generateDefaultLockScript()
              )
              expect(stubbedUpsertTxHashesFn).toHaveBeenCalledWith(
                [fakeTx3.transaction.hash],
                AddressMeta.fromObject(addressObj).generateDefaultLockScript()
              )
            })
            it('emits new transactions in batch by the next unprocessed block number', () => {
              expect(txObserver).toHaveBeenCalledTimes(1)
              expect(txObserver).toHaveBeenCalledWith([fakeTx1])
            });
          });
        });
        describe('when there are no transactions matched', () => {
          let txObserver: any
          let errSpy: any
          beforeEach(async () => {
            stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce(undefined)
            stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValueOnce([])
            stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValueOnce([])
            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
            errSpy = await connectIndexer(indexerConnector)
          });
          it('should not emit transactions', () => {
            expect(errSpy).toHaveBeenCalledTimes(0)
            expect(txObserver).toHaveBeenCalledTimes(0)
          });
        });
        describe('failure cases', () => {
          let txObserver: any
          let errSpy: any
          beforeEach(async () => {
            stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([fakeTx3.transaction.hash])
            stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValue([fakeTxHashCache3])
            stubbedGetTransactionFn.mockReturnValueOnce(undefined)

            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
            errSpy = await connectIndexer(indexerConnector)
          });
          it('throws error when there no transaction matched to a hash', () => {
            expect(stubbedLoggerErrorFn).toHaveBeenCalled()
            expect(errSpy).toHaveBeenCalledWith(new Error(`failed to fetch transaction for hash ${fakeTx3.transaction.hash}`))
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
          stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReturnValue([])
          await connectIndexer(indexerConnector)
        });
        describe('when the block tip is higher than previous one', () => {
          it('observed new tips', async () => {
            for (let second = 1; second <= 1; second++) {
              jest.advanceTimersByTime(5000)
              await flushPromises()
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

import { when } from 'jest-when'
import path from 'path'
import AddressGenerator from "../../src/models/address-generator"
import { AddressPrefix, AddressType } from '../../src/models/keys/address'
import { Address, AddressVersion } from '../../src/database/address/address-dao'
import SystemScriptInfo from '../../src/models/system-script-info'
import IndexerConnector from '../../src/block-sync-renderer/sync/indexer-connector'
import { flushPromises } from '../test-utils'

const stubbedStartForeverFn = jest.fn()
const stubbedTipFn = jest.fn()
const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()
const stubbedUpsertTxHashesFn = jest.fn()
const stubbedNextUnprocessedTxsGroupedByBlockNumberFn = jest.fn()
const stubbedLoggerErrorFn = jest.fn()
const stubbedNextUnprocessedBlock = jest.fn()

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

  let stubbedIndexerConstructor: any
  let stubbedIndexerCacheService: any
  let stubbedRPCServiceConstructor: any

  const resetMocks = () => {
    stubbedTipFn.mockReset()
    stubbedStartForeverFn.mockReset()
    stubbedGetTransactionFn.mockReset()
    stubbedGetHeaderFn.mockReset()
    stubbedUpsertTxHashesFn.mockReset()
    stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReset()
    stubbedLoggerErrorFn.mockReset()
    stubbedNextUnprocessedBlock.mockReset()
  }

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers()
    stubbedIndexerConstructor = jest.fn().mockImplementation(
      () => ({
        startForever: stubbedStartForeverFn,
        tip: stubbedTipFn,
      })
    )

    stubbedIndexerCacheService = jest.fn().mockImplementation(
      () => ({
        upsertTxHashes: stubbedUpsertTxHashesFn,
        nextUnprocessedTxsGroupedByBlockNumber: stubbedNextUnprocessedTxsGroupedByBlockNumberFn,
      })
    )
    stubbedIndexerCacheService.nextUnprocessedBlock = stubbedNextUnprocessedBlock

    stubbedRPCServiceConstructor = jest.fn().mockImplementation(
      () => ({
        getTransaction: stubbedGetTransactionFn,
        getHeader: stubbedGetHeaderFn
      })
    )

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
  });
  afterEach(() => {
    jest.clearAllTimers()
  });

  describe('#constructor', () => {
    beforeEach(() => {
      new stubbedIndexerConnector([], nodeUrl, indexerFolderPath)
    });
    it('init with a node url and indexer folder path', () => {
      expect(stubbedIndexerConstructor).toHaveBeenCalledWith(nodeUrl, path.join(indexerFolderPath))
    });
  });
  describe('#connect', () => {
    const fakeTip1 = {block_number: '1', block_hash: 'hash1'}
    const fakeTip2 = {block_number: '2', block_hash: 'hash2'}
    const fakeBlock1 = {number: '1', hash: '1', timestamp: '1'}
    const fakeBlock2 = {number: '2', hash: '2', timestamp: '2'}
    const fakeBlock3 = {number: '3', hash: '3', timestamp: '3'}
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
    const walletId1 = 'walletid1'
    const walletId2 = 'walletid2'
    const addressObj1: Address = {
      address,
      blake160: '0x',
      walletId: walletId1,
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
    const addressObj2: Address = {
      address,
      blake160: '0x',
      walletId: walletId2,
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
    const addressesToWatch = [addressObj1, addressObj2]

    beforeEach(() => {
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
          indexerConnector = new stubbedIndexerConnector(addressesToWatch, '', '')
          transactionsSubject = indexerConnector.transactionsSubject
        });

        describe('when there are transactions', () => {
          let txObserver: any
          beforeEach(() => {
            stubbedUpsertTxHashesFn.mockResolvedValueOnce([fakeTx1.transaction.hash, fakeTx2.transaction.hash])
            stubbedUpsertTxHashesFn.mockResolvedValueOnce([fakeTx3.transaction.hash])

            when(stubbedGetTransactionFn)
              .calledWith(fakeTx1.transaction.hash).mockResolvedValueOnce(fakeTx1)
              .calledWith(fakeTx2.transaction.hash).mockResolvedValueOnce(fakeTx2)
              .calledWith(fakeTx3.transaction.hash).mockResolvedValueOnce(fakeTx3)

            when(stubbedGetHeaderFn)
              .calledWith(fakeBlock1.hash).mockResolvedValueOnce(fakeBlock1)
              .calledWith(fakeBlock2.hash).mockResolvedValueOnce(fakeBlock2)

            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
          });
          describe('attempts to upsert tx hash caches', () => {
            beforeEach(async () => {
              await connectIndexer(indexerConnector)
            });
            it('upserts tx hash caches', () => {
              expect(stubbedUpsertTxHashesFn).toHaveBeenCalled()
            })
          });
          describe('when loaded block number is already in order', () => {
            beforeEach(async () => {
              when(stubbedNextUnprocessedTxsGroupedByBlockNumberFn)
                .calledWith().mockResolvedValueOnce([
                  fakeTxHashCache1,
                ])
                .calledWith().mockResolvedValueOnce([
                  fakeTxHashCache2,
                  fakeTxHashCache3
                ])

              await connectIndexer(indexerConnector)
              await flushPromises()
            });
            it('emits new transactions in batch by the next unprocessed block number', () => {
              expect(txObserver).toHaveBeenCalledTimes(1)
              expect(txObserver).toHaveBeenCalledWith([fakeTx1])
            });
          });
          describe('when loaded block number is not in order', () => {
            beforeEach(async () => {
              when(stubbedNextUnprocessedTxsGroupedByBlockNumberFn)
                .calledWith().mockResolvedValueOnce([
                  fakeTxHashCache2,
                  fakeTxHashCache3
                ])
                .calledWith().mockResolvedValueOnce([
                  fakeTxHashCache1,
                ])

              await connectIndexer(indexerConnector)
              await flushPromises()
            });
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
            stubbedUpsertTxHashesFn.mockResolvedValue([])
            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
            errSpy = await connectIndexer(indexerConnector)
            expect(errSpy).toHaveBeenCalledTimes(0)
          });
          it('should not emit transactions', () => {
            expect(txObserver).toHaveBeenCalledTimes(0)
          });
          it('attempts checking transactions in next unprocessed block number', () => {
            expect(stubbedNextUnprocessedTxsGroupedByBlockNumberFn).toHaveBeenCalled()
          })
        });
        describe('failure cases', () => {
          let txObserver: any
          beforeEach(async () => {
            stubbedUpsertTxHashesFn.mockReturnValueOnce([fakeTx3.transaction.hash])
            when(stubbedNextUnprocessedTxsGroupedByBlockNumberFn)
              .calledWith().mockResolvedValue([fakeTxHashCache3])
            when(stubbedGetTransactionFn)
              .calledWith(fakeTxHashCache1.txHash).mockResolvedValueOnce(undefined)

            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
            await connectIndexer(indexerConnector)
            await flushPromises()
          });
          it('throws error when there no transaction matched to a hash from #processNextBlockNumberQueue', () => {
            expect(stubbedLoggerErrorFn).toHaveBeenCalledWith(new Error('failed to fetch transaction for hash hash3'))
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
          stubbedTipFn.mockReturnValueOnce(fakeTip1)
          stubbedTipFn.mockReturnValueOnce(fakeTip2)
          stubbedGetTransactionFn.mockResolvedValue(fakeTx3)
          stubbedGetHeaderFn.mockResolvedValue(fakeBlock2)
          stubbedUpsertTxHashesFn.mockResolvedValue([])
          stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockResolvedValue([])
          stubbedNextUnprocessedBlock.mockResolvedValue(undefined)
          await connectIndexer(indexerConnector)
        });
        it('observes an indexer tip', () => {
          expect(tipObserver).toHaveBeenCalledTimes(1)
          expect(tipObserver).toHaveBeenCalledWith(fakeTip1)
        });
        describe('fast forward the interval time', () => {
          describe('when there is no unprocessed blocks', () => {
            beforeEach(async () => {
              stubbedNextUnprocessedBlock.mockResolvedValue(undefined)
              jest.advanceTimersByTime(5000)
              await flushPromises()
            });
            it('observes another indexer tip', async () => {
              expect(tipObserver).toHaveBeenCalledTimes(2)
              expect(tipObserver).toHaveBeenCalledWith(fakeTip2)
            })
          });
          describe('when there are unprocessed blocks', () => {
            beforeEach(async () => {
              stubbedNextUnprocessedBlock.mockResolvedValue({
                blockNumber: fakeBlock3.number,
                blockHash: fakeBlock3.hash,
              })
              jest.advanceTimersByTime(5000)
              await flushPromises()
            });
            it('observes next unprocessed block tip', async () => {
              expect(tipObserver).toHaveBeenCalledTimes(2)
              expect(tipObserver).toHaveBeenCalledWith({
                block_number: fakeBlock3.number,
                block_hash: fakeBlock3.hash,
              })
            })
          });
        });
      });
    })
  });
});

import { scriptToAddress } from '../../src/utils/scriptAndAddress'
import { when } from 'jest-when'
import { hd } from '@ckb-lumos/lumos'
import { Address, AddressVersion } from '../../src/models/address'
import SystemScriptInfo from '../../src/models/system-script-info'
import FullSynchronizer from '../../src/block-sync-renderer/sync/full-synchronizer'
import { flushPromises } from '../test-utils'

const { AddressType } = hd

const stubbedTipFn = jest.fn()
const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()
const stubbedUpsertTxHashesFn = jest.fn()
const stubbedNextUnprocessedTxsGroupedByBlockNumberFn = jest.fn()
const stubbedLoggerErrorFn = jest.fn()
const stubbedNextUnprocessedBlock = jest.fn()
const stubbedCellCellectFn = jest.fn()

const connectIndexer = async (synchronizer: FullSynchronizer) => {
  const connectPromise = synchronizer.connect()
  const errSpy = jest.fn()
  connectPromise.catch(err => {
    errSpy(err)
  })
  await flushPromises()
  return errSpy
}

describe('unit tests for IndexerConnector', () => {
  const nodeUrl = 'http://nodeurl:8114'
  let stubbedFullSynchronizer: any

  let stubbedIndexerConstructor: any
  let stubbedIndexerCacheService: any
  let stubbedRPCServiceConstructor: any
  let stubbedCellCollectorConstructor: any

  const resetMocks = () => {
    stubbedTipFn.mockReset()
    stubbedGetTransactionFn.mockReset()
    stubbedGetHeaderFn.mockReset()
    stubbedUpsertTxHashesFn.mockReset()
    stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReset()
    stubbedLoggerErrorFn.mockReset()
    stubbedNextUnprocessedBlock.mockReset()
    stubbedCellCellectFn.mockReset()
  }

  stubbedIndexerConstructor = jest.fn()
  stubbedIndexerCacheService = jest.fn()
  stubbedIndexerCacheService.nextUnprocessedBlock = stubbedNextUnprocessedBlock
  stubbedIndexerCacheService.nextUnprocessedTxsGroupedByBlockNumber = stubbedNextUnprocessedTxsGroupedByBlockNumberFn
  stubbedRPCServiceConstructor = jest.fn()
  stubbedCellCollectorConstructor = jest.fn()

  jest.doMock('@ckb-lumos/ckb-indexer', () => {
    return {
      Indexer: stubbedIndexerConstructor.mockImplementation(() => ({
        tip: stubbedTipFn,
      })),
      CellCollector: stubbedCellCollectorConstructor.mockImplementation(() => ({
        collect: stubbedCellCellectFn,
      })),
    }
  })
  jest.doMock('services/rpc-service', () => {
    return stubbedRPCServiceConstructor.mockImplementation(() => ({
      getTransaction: stubbedGetTransactionFn,
      getHeader: stubbedGetHeaderFn,
    }))
  })
  jest.doMock('utils/logger', () => {
    return { error: stubbedLoggerErrorFn }
  })
  jest.doMock('../../src/block-sync-renderer/sync/indexer-cache-service', () => {
    return stubbedIndexerCacheService.mockImplementation(() => ({
      upsertTxHashes: stubbedUpsertTxHashesFn,
    }))
  })
  stubbedFullSynchronizer = require('../../src/block-sync-renderer/sync/full-synchronizer').default

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers('legacy')
  })
  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('#constructor', () => {
    describe('when init with indexer folder path', () => {
      beforeEach(() => {
        new stubbedFullSynchronizer([], nodeUrl)
      })
      it('inits lumos indexer with a node url and indexer folder path', () => {
        expect(stubbedIndexerConstructor).toHaveBeenCalledWith(nodeUrl)
      })
    })
    describe('when init without indexer folder path', () => {
      beforeEach(() => {
        new stubbedFullSynchronizer([], nodeUrl)
      })
      it('inits mercury indexer with a node url and a default port', () => {
        expect(stubbedIndexerConstructor).toHaveBeenCalledWith(nodeUrl)
      })
    })
  })
  describe('#connect', () => {
    const fakeTip1 = { blockNumber: '1', blockHash: 'hash1', indexerTipNumber: '1' }
    const fakeTip2 = { blockNumber: '2', blockHash: 'hash2', indexerTipNumber: '2' }
    const fakeBlock1 = { number: '1', hash: '1', timestamp: '1' }
    const fakeBlock2 = { number: '2', hash: '2', timestamp: '2' }
    const fakeBlock3 = { number: '3', hash: '3', timestamp: '3' }
    const fakeTx1 = {
      transaction: { hash: 'hash1', blockNumber: fakeBlock1.number, blockTimestamp: new Date(1) },
      txStatus: { status: 'committed', blockHash: fakeBlock1.hash },
    }
    const fakeTx2 = {
      transaction: { hash: 'hash2', blockNumber: fakeBlock2.number, blockTimestamp: new Date(2) },
      txStatus: { status: 'committed', blockHash: fakeBlock2.hash },
    }
    const fakeTx3 = {
      transaction: { hash: 'hash3', blockNumber: fakeBlock2.number, blockTimestamp: new Date(3) },
      txStatus: { status: 'committed', blockHash: fakeBlock2.hash },
    }

    const fakeTxHashCache1 = {
      txHash: fakeTx1.transaction.hash,
      blockNumber: fakeTx1.transaction.blockNumber,
      blockTimestamp: fakeTx1.transaction.blockTimestamp,
    }
    const fakeTxHashCache2 = {
      txHash: fakeTx2.transaction.hash,
      blockNumber: fakeTx2.transaction.blockNumber,
      blockTimestamp: fakeTx2.transaction.blockTimestamp,
    }
    const fakeTxHashCache3 = {
      txHash: fakeTx3.transaction.hash,
      blockNumber: fakeTx3.transaction.blockNumber,
      blockTimestamp: fakeTx3.transaction.blockTimestamp,
    }

    let indexerConnector: FullSynchronizer
    const shortAddressInfo = {
      lock: SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c'),
    }
    const address = scriptToAddress(shortAddressInfo.lock, false)
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
      version: AddressVersion.Testnet,
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
      version: AddressVersion.Testnet,
    }
    const addressesToWatch = [addressObj1, addressObj2]

    beforeEach(() => {
      indexerConnector = new stubbedFullSynchronizer(addressesToWatch, '', '')
    })
    describe('polls for new data', () => {
      describe('#transactionsSubject', () => {
        let transactionsSubject: any
        beforeEach(() => {
          stubbedTipFn.mockReturnValueOnce(fakeTip1)

          indexerConnector = new stubbedFullSynchronizer(addressesToWatch, '', '')
          transactionsSubject = indexerConnector.transactionsSubject
        })

        describe('when there are transactions', () => {
          let txObserver: any
          beforeEach(() => {
            stubbedUpsertTxHashesFn.mockResolvedValueOnce([fakeTx1.transaction.hash, fakeTx2.transaction.hash])
            stubbedUpsertTxHashesFn.mockResolvedValueOnce([fakeTx3.transaction.hash])

            when(stubbedGetTransactionFn)
              .calledWith(fakeTx1.transaction.hash)
              .mockResolvedValue(fakeTx1)
              .calledWith(fakeTx2.transaction.hash)
              .mockResolvedValue(fakeTx2)
              .calledWith(fakeTx3.transaction.hash)
              .mockResolvedValue(fakeTx3)

            when(stubbedGetHeaderFn)
              .calledWith(fakeBlock1.hash)
              .mockResolvedValue(fakeBlock1)
              .calledWith(fakeBlock2.hash)
              .mockResolvedValue(fakeBlock2)

            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
          })
          describe('attempts to upsert tx hash caches', () => {
            beforeEach(async () => {
              await connectIndexer(indexerConnector)
            })
            it('upserts tx hash caches', () => {
              expect(stubbedUpsertTxHashesFn).toHaveBeenCalled()
            })
          })
          describe('when loaded block number is already in order', () => {
            beforeEach(async () => {
              when(stubbedNextUnprocessedTxsGroupedByBlockNumberFn)
                .calledWith(addressObj1.walletId)
                .mockResolvedValueOnce([fakeTxHashCache1])
                .calledWith(addressObj2.walletId)
                .mockResolvedValueOnce([fakeTxHashCache2, fakeTxHashCache3])

              await connectIndexer(indexerConnector)
              await flushPromises()
            })
            it('emits new transactions in batch by the next unprocessed block number', () => {
              expect(txObserver).toHaveBeenCalledTimes(1)
              expect(txObserver).toHaveBeenCalledWith({
                txHashes: [fakeTx1.transaction.hash],
                params: fakeTx1.transaction.blockNumber,
              })
            })
          })
          describe('when loaded block number is not in order', () => {
            beforeEach(async () => {
              when(stubbedNextUnprocessedTxsGroupedByBlockNumberFn)
                .calledWith(addressObj1.walletId)
                .mockResolvedValueOnce([fakeTxHashCache2, fakeTxHashCache3])
                .calledWith(addressObj2.walletId)
                .mockResolvedValueOnce([fakeTxHashCache1])

              await connectIndexer(indexerConnector)
              await flushPromises()
            })
            it('emits new transactions in batch by the next unprocessed block number', () => {
              expect(txObserver).toHaveBeenCalledTimes(1)
              expect(txObserver).toHaveBeenCalledWith({
                txHashes: [fakeTx1.transaction.hash],
                params: fakeTx1.transaction.blockNumber,
              })
            })
          })
          describe('#notifyCurrentBlockNumberProcessed', () => {
            beforeEach(async () => {
              stubbedNextUnprocessedTxsGroupedByBlockNumberFn
                .mockResolvedValueOnce([fakeTxHashCache1, fakeTxHashCache2])
                .mockResolvedValueOnce([fakeTxHashCache3])

              await connectIndexer(indexerConnector)
              await flushPromises()
            })
            it('emits new transactions', async () => {
              expect(txObserver).toHaveBeenCalledTimes(1)
            })
            describe('when match with the current block number in process', () => {
              describe('having unprocessed transactions', () => {
                beforeEach(async () => {
                  stubbedNextUnprocessedTxsGroupedByBlockNumberFn
                    .mockResolvedValueOnce([fakeTxHashCache3])
                    .mockResolvedValueOnce([fakeTxHashCache3])
                  indexerConnector.notifyCurrentBlockNumberProcessed(fakeTx1.transaction.blockNumber)
                  await flushPromises()
                })
                it('emits new transactions', async () => {
                  expect(txObserver).toHaveBeenCalledTimes(2)
                })
              })
              describe('having no unprocessed transactions', () => {
                beforeEach(async () => {
                  stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockResolvedValueOnce([]).mockResolvedValueOnce([])
                  indexerConnector.notifyCurrentBlockNumberProcessed(fakeTx1.transaction.blockNumber)
                  await flushPromises()
                })
                it('emits new transactions', async () => {
                  expect(txObserver).toHaveBeenCalledTimes(1)
                })
              })
            })
            describe('when not match with the current block number in process', () => {
              beforeEach(async () => {
                stubbedNextUnprocessedTxsGroupedByBlockNumberFn
                  .mockResolvedValueOnce([fakeTxHashCache3])
                  .mockResolvedValueOnce([fakeTxHashCache3])
                indexerConnector.notifyCurrentBlockNumberProcessed('3')
                await flushPromises()
              })
              it('should not emit new transactions', async () => {
                expect(txObserver).toHaveBeenCalledTimes(1)
              })
            })
          })
        })
        describe('when there are no transactions matched', () => {
          let txObserver: any
          let errSpy: any
          beforeEach(async () => {
            stubbedUpsertTxHashesFn.mockResolvedValue([])
            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
            errSpy = await connectIndexer(indexerConnector)
            expect(errSpy).toHaveBeenCalledTimes(0)
          })
          it('should not emit transactions', () => {
            expect(txObserver).toHaveBeenCalledTimes(0)
          })
          it('attempts checking transactions in next unprocessed block number', () => {
            expect(stubbedNextUnprocessedTxsGroupedByBlockNumberFn).toHaveBeenCalled()
          })
        })
        describe('failure cases when there no transaction matched to a hash from #processNextBlockNumberQueue', () => {
          let txObserver: any
          beforeEach(async () => {
            stubbedUpsertTxHashesFn.mockReturnValueOnce([fakeTx3.transaction.hash])
            stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockRejectedValue('exception')

            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
            await connectIndexer(indexerConnector)
            await flushPromises()
          })
          it('throws error', async () => {
            expect(stubbedLoggerErrorFn).toHaveBeenCalledWith(
              'Connector: \tError in processing next block number queue: Error: exception'
            )
          })
        })
      })
      describe('#blockTipsSubject', () => {
        let tipObserver: any
        beforeEach(async () => {
          tipObserver = jest.fn()
          indexerConnector.blockTipsSubject.subscribe(tip => {
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
        })
        it('observes an indexer tip', () => {
          expect(tipObserver).toHaveBeenCalledTimes(1)
          expect(tipObserver).toHaveBeenCalledWith({
            cacheTipNumber: parseInt(fakeTip1.blockNumber),
            indexerTipNumber: parseInt(fakeTip1.blockNumber),
          })
        })
        describe('fast forward the interval time', () => {
          describe('when there is no unprocessed blocks', () => {
            beforeEach(async () => {
              stubbedNextUnprocessedBlock.mockResolvedValue(undefined)
              jest.advanceTimersByTime(5000)
              await flushPromises()
            })
            it('observes another indexer tip', async () => {
              expect(tipObserver).toHaveBeenCalledTimes(2)
              expect(tipObserver).toHaveBeenCalledWith({
                cacheTipNumber: parseInt(fakeTip2.blockNumber),
                indexerTipNumber: parseInt(fakeTip2.blockNumber),
              })
            })
          })
          describe('when there are unprocessed blocks', () => {
            beforeEach(async () => {
              stubbedNextUnprocessedBlock.mockResolvedValue(fakeBlock3.number)
              jest.advanceTimersByTime(5000)
              await flushPromises()
            })
            it('observes next unprocessed block tip', async () => {
              expect(tipObserver).toHaveBeenCalledTimes(2)
              expect(tipObserver).toHaveBeenCalledWith({
                cacheTipNumber: parseInt(fakeBlock3.number),
                indexerTipNumber: parseInt(fakeTip2.blockNumber),
              })
            })
          })
        })
      })
    })
  })
})

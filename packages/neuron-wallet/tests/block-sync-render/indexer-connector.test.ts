import { when } from 'jest-when'
import path from 'path'
import AddressGenerator from "../../src/models/address-generator"
import { AddressPrefix, AddressType } from '../../src/models/keys/address'
import { Address, AddressVersion } from '../../src/models/address'
import SystemScriptInfo from '../../src/models/system-script-info'
import IndexerConnector, { LumosCellQuery } from '../../src/block-sync-renderer/sync/indexer-connector'
import { flushPromises } from '../test-utils'

const stubbedStartForeverFn = jest.fn()
const stubbedTipFn = jest.fn()
const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()
const stubbedUpsertTxHashesFn = jest.fn()
const stubbedNextUnprocessedTxsGroupedByBlockNumberFn = jest.fn()
const stubbedLoggerErrorFn = jest.fn()
const stubbedNextUnprocessedBlock = jest.fn()
const stubbedCellCellectFn = jest.fn()

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
  const indexerFolderPath = path.join('indexer', 'data', 'path')
  let stubbedIndexerConnector: any

  let stubbedIndexerConstructor: any
  let stubbedIndexerCacheService: any
  let stubbedRPCServiceConstructor: any
  let stubbedCellCollectorConstructor: any

  const resetMocks = () => {
    stubbedTipFn.mockReset()
    stubbedStartForeverFn.mockReset()
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
  stubbedRPCServiceConstructor = jest.fn()
  stubbedCellCollectorConstructor = jest.fn()

  jest.doMock('@ckb-lumos/indexer', () => {
    return {
      Indexer : stubbedIndexerConstructor.mockImplementation(
        () => ({
          startForever: stubbedStartForeverFn,
          tip: stubbedTipFn,
        })
      ),
      CellCollector: stubbedCellCollectorConstructor.mockImplementation(
        () => ({
          collect: stubbedCellCellectFn
        })
      )
    }
  });
  jest.doMock('services/rpc-service', () => {
    return stubbedRPCServiceConstructor.mockImplementation(
      () => ({
        getTransaction: stubbedGetTransactionFn,
        getHeader: stubbedGetHeaderFn
      })
    )
  });
  jest.doMock('utils/logger', () => {
    return {error: stubbedLoggerErrorFn}
  });
  jest.doMock('../../src/block-sync-renderer/sync/indexer-cache-service', () => {
    return stubbedIndexerCacheService.mockImplementation(
      () => ({
        upsertTxHashes: stubbedUpsertTxHashesFn,
        nextUnprocessedTxsGroupedByBlockNumber: stubbedNextUnprocessedTxsGroupedByBlockNumberFn,
      })
    )
  });
  stubbedIndexerConnector = require('../../src/block-sync-renderer/sync/indexer-connector').default

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers()

  });
  afterEach(() => {
    jest.clearAllTimers()
  });

  describe('#constructor', () => {
    describe('when init with indexer folder path', () => {
      beforeEach(() => {
        new stubbedIndexerConnector([], nodeUrl, indexerFolderPath)
      });
      it('inits lumos indexer with a node url and indexer folder path', () => {
        expect(stubbedIndexerConstructor).toHaveBeenCalledWith(nodeUrl, path.join(indexerFolderPath))
      });
    });
    describe('when init without indexer folder path', () => {
      beforeEach(() => {
        new stubbedIndexerConnector([], nodeUrl)
      });
      it('inits lumos indexer with a node url and a default indexer folder path', () => {
        let expectPathRegex
        if (process.platform === 'win32') {
          expectPathRegex = expect.stringMatching(/test\\indexer_data/)
        }
        else {
          expectPathRegex = expect.stringMatching(/test\/indexer_data/)
        }

        expect(stubbedIndexerConstructor).toHaveBeenCalledWith(
          nodeUrl,
          expectPathRegex
        )
      })
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
        stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockResolvedValue([])
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
              .calledWith(fakeTx1.transaction.hash).mockResolvedValue(fakeTx1)
              .calledWith(fakeTx2.transaction.hash).mockResolvedValue(fakeTx2)
              .calledWith(fakeTx3.transaction.hash).mockResolvedValue(fakeTx3)

            when(stubbedGetHeaderFn)
              .calledWith(fakeBlock1.hash).mockResolvedValue(fakeBlock1)
              .calledWith(fakeBlock2.hash).mockResolvedValue(fakeBlock2)

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
          describe('#notifyCurrentBlockNumberProcessed', () => {
            beforeEach(async () => {
              stubbedNextUnprocessedTxsGroupedByBlockNumberFn
                .mockResolvedValueOnce([
                  fakeTxHashCache1,
                  fakeTxHashCache2
                ])
                .mockResolvedValueOnce([
                  fakeTxHashCache3,
                ])

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
                    .mockResolvedValueOnce([
                      fakeTxHashCache3
                    ])
                    .mockResolvedValueOnce([
                      fakeTxHashCache3,
                    ])
                  indexerConnector.notifyCurrentBlockNumberProcessed(fakeTx1.transaction.blockNumber)
                  await flushPromises()
                })
                it('emits new transactions', async () => {
                  expect(txObserver).toHaveBeenCalledTimes(2)
                })
              });
              describe('having no unprocessed transactions', () => {
                beforeEach(async () => {
                  stubbedNextUnprocessedTxsGroupedByBlockNumberFn
                    .mockResolvedValueOnce([])
                    .mockResolvedValueOnce([])
                  indexerConnector.notifyCurrentBlockNumberProcessed(fakeTx1.transaction.blockNumber)
                  await flushPromises()
                })
                it('emits new transactions', async () => {
                  expect(txObserver).toHaveBeenCalledTimes(1)
                })
              });
            });
            describe('when not match with the current block number in process', () => {
              beforeEach(async () => {
                stubbedNextUnprocessedTxsGroupedByBlockNumberFn
                  .mockResolvedValueOnce([
                    fakeTxHashCache3
                  ])
                  .mockResolvedValueOnce([
                    fakeTxHashCache3,
                  ])
                indexerConnector.notifyCurrentBlockNumberProcessed('3')
                await flushPromises()
              })
              it('should not emit new transactions', async () => {
                expect(txObserver).toHaveBeenCalledTimes(1)
              })
            });
          })
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
        describe('failure cases when there no transaction matched to a hash from #processNextBlockNumberQueue', () => {
          let txObserver: any
          beforeEach(async () => {
            stubbedUpsertTxHashesFn.mockReturnValueOnce([fakeTx3.transaction.hash])
            stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockResolvedValue([fakeTxHashCache3])
            when(stubbedGetTransactionFn)
              .calledWith(fakeTxHashCache3.txHash).mockResolvedValueOnce(undefined)

            txObserver = jest.fn()
            transactionsSubject.subscribe((transactions: any) => txObserver(transactions))
            await connectIndexer(indexerConnector)
            await flushPromises()
          });
          it('throws error', async () => {
            expect(stubbedLoggerErrorFn).toHaveBeenCalledWith('Error in processing next block number queue: Error: failed to fetch transaction for hash hash3')
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
    describe('#getLiveCellsByScript', () => {
      let fakeCell1: any, fakeCell2: any
      let cells: any

      fakeCell1 = {
        cell_output: {
          lock: {
            hash_type: 'type',
            code_hash: '0xcode',
            args: '0x1'
          },
          type: {
            hash_type: 'data',
            code_hash: '0xcode',
            args: '0x1'
          }
        }
      }
      fakeCell2 = {
        cell_output: {
          lock: {
            hash_type: 'type',
            code_hash: '0xcode',
            args: '0x2'
          },
          type: {
            hash_type: 'lock',
            code_hash: '0xcode',
            args: '0x2'
          }
        }
      }
      const fakeCells = [fakeCell1, fakeCell2]

      describe('when success', () => {
        const query: LumosCellQuery = {
          lock: {
            hashType: 'data',
            codeHash: '0xcode',
            args: '0x'
          },
          type: {
            //test the workaround for this lumos data issue
            //@ts-ignore
            hashType: 'lock',
            codeHash: '0xcode',
            args: '0x'
          },
          data: null
        }

        beforeEach(async () => {
          stubbedCellCellectFn.mockReturnValueOnce(
            [
              new Promise(resolve => resolve(JSON.parse(JSON.stringify(fakeCells[0])))),
              new Promise(resolve => resolve(JSON.parse(JSON.stringify(fakeCells[1]))))
            ]
          )

          cells = await indexerConnector.getLiveCellsByScript(query)
        });
        it('transform the query parameter', () => {
          expect(stubbedCellCollectorConstructor.mock.calls[0][1]).toEqual({
            lock: {
              hash_type: query.lock!.hashType,
              code_hash: query.lock!.codeHash,
              args: query.lock!.args,
            },
            type: {
              hash_type: query.type!.hashType,
              code_hash: query.type!.codeHash,
              args: query.type!.args,
            },
            data: 'any'
          })
        })
        it('returns live cells with property value fix', async () => {
          fakeCell2.cell_output.type.hash_type = 'data'
          expect(cells).toEqual([fakeCell1, fakeCell2])
        })
      });
      describe('when handling concurrent requests', () => {
        const query1: LumosCellQuery = {
          lock: {
            hashType: 'data',
            codeHash: '0xcode',
            args: '0x1'
          },
          type: {
            hashType: 'data',
            codeHash: '0xcode',
            args: '0x1'
          },
          data: null
        }
        const query2: LumosCellQuery = {
          lock: {
            hashType: 'type',
            codeHash: '0xcode',
            args: '0x2'
          },
          type: {
            hashType: 'type',
            codeHash: '0xcode',
            args: '0x2'
          },
          data: null
        }

        const results: unknown[] = []
        beforeEach(async () => {

          const stubbedCellCellect1 = jest.fn()
          stubbedCellCellect1.mockReturnValueOnce(
            [
              new Promise(resolve => {
                //fake the waiting, the other concurrent requests should wait until this is finished
                setTimeout(() => {
                  resolve(JSON.parse(JSON.stringify(fakeCells[0])))
                }, 500)
              }),
            ]
          )

          const stubbedCellCellect2 = jest.fn()
          stubbedCellCellect2.mockReturnValueOnce(
            [
              new Promise(resolve => resolve(JSON.parse(JSON.stringify(fakeCells[1])))),
            ]
          )

          stubbedCellCollectorConstructor.mockImplementation(
            (_indexer: any, query: any) => {
              if (query.lock.args === '0x1') {
                return {
                  collect: stubbedCellCellect1,
                }
              }
              if (query.lock.args === '0x2') {
                return {
                  collect: stubbedCellCellect2,
                }
              }
            }
          )

          const promises = Promise.all([
            new Promise(resolve => {
              indexerConnector.getLiveCellsByScript(query1).then(cells => {
                results.push(cells)
                resolve()
              })
            }),
            new Promise(resolve => {
              indexerConnector.getLiveCellsByScript(query2).then(cells => {
                results.push(cells)
                resolve()
              })
            })
          ])

          jest.advanceTimersByTime(500)
          await promises
        });
        it('process one by one in order', () => {
          expect(results.length).toEqual(2)
          expect(results[0]).toEqual([fakeCells[0]])
        })
      });
      describe('when fails', () => {
        describe('when both type and lock parameter is not specified', () => {
          it('throws error', async () => {
            let err
            try {
              await indexerConnector.getLiveCellsByScript({lock: null, type: null, data: null})
            } catch (error) {
              err = error
            }
            expect(err).toEqual(new Error('at least one parameter is required'))
          })
        });
      });
    })
  });
});

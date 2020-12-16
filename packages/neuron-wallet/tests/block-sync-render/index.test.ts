import { EventEmitter } from 'events'
import { LumosCellQuery } from "../../src/block-sync-renderer/sync/indexer-connector"
import { flushPromises } from '../test-utils'

const stubbedElectronBrowserOn = jest.fn()
const stubbedElectronBrowserLoadURL = jest.fn()
const stubbedElectronBrowserWebContentSend = jest.fn()
const stubbedAddressCreatedSubjectSubscribe = jest.fn()
const stubbedWalletDeletedSubjectSubscribe = jest.fn()
const stubbedQueryIndexer = jest.fn()
const stubbedResetIndexerData = jest.fn()
const stubbedDataUpdateSubject = jest.fn()
const stubbedSyncTaskStart = jest.fn()
const stubbedUnmountSyncTask = jest.fn()
const stubbedSyncApiControllerEmitter = jest.fn()
const stubbedTxDbChangedSubjectNext = jest.fn()
const stubbedAddressDbChangedSubjectNext = jest.fn()
const stubbedGetCurrentNetwork = jest.fn()
const stubbedmaintainAddressesIfNecessary = jest.fn()
const stubbedFork = jest.fn()
const stubbedLoggerInfo = jest.fn()
const stubbedLoggerDebug = jest.fn()
const stubbedLoggerError = jest.fn()

const stubbedIpcMainOnce = jest.fn()

const stubbedElectronBrowserConstructor = jest.fn().mockImplementation(
  () => ({
    on: stubbedElectronBrowserOn,
    loadURL: stubbedElectronBrowserLoadURL,
    webContents: {
      send: stubbedElectronBrowserWebContentSend
    }
  })
)

const stubbedSyncTaskCtor = jest.fn().mockImplementation(
  () => ({
    queryIndexer: stubbedQueryIndexer
  })
)

const resetMocks = () => {
  stubbedElectronBrowserOn.mockReset()
  stubbedElectronBrowserLoadURL.mockReset()
  stubbedElectronBrowserWebContentSend.mockReset()

  stubbedAddressCreatedSubjectSubscribe.mockReset()
  stubbedWalletDeletedSubjectSubscribe.mockReset()

  stubbedTxDbChangedSubjectNext.mockReset()
  stubbedSyncApiControllerEmitter.mockReset()

  stubbedIpcMainOnce.mockReset()
  stubbedQueryIndexer.mockReset()
  stubbedResetIndexerData.mockReset()
  stubbedGetCurrentNetwork.mockReset()
  stubbedmaintainAddressesIfNecessary.mockReset()

  stubbedUnmountSyncTask.mockReset()
  stubbedSyncTaskStart.mockReset()

  stubbedFork.mockReset()
  stubbedLoggerInfo.mockReset()
  stubbedLoggerDebug.mockReset()
  stubbedLoggerError.mockReset()
}

describe('block sync render', () => {
  describe('in main process', () => {
    let queryIndexer: any
    let createBlockSyncTask: any
    let resetSyncTask: any
    let childProcessEmiter: any

    const network = {
      id: 'id',
      genesisHash: '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5'
    }

    beforeEach(async () => {
      resetMocks()
      jest.useFakeTimers()
      childProcessEmiter = new EventEmitter()

      jest.doMock('electron', () => {
        return {
          BrowserWindow: stubbedElectronBrowserConstructor,
          ipcMain: {
            once: stubbedIpcMainOnce
          }
        }
      });

      jest.doMock('models/subjects/address-created-subject', () => {
        return {
          getSubject: () => ({
            subscribe: stubbedAddressCreatedSubjectSubscribe
          })
        }
      });
      jest.doMock('models/subjects/wallet-deleted-subject', () => {
        return {
          getSubject: () => ({
            subscribe: stubbedWalletDeletedSubjectSubscribe
          })
        }
      });

      jest.doMock('../../src/block-sync-renderer/sync/indexer-folder-manager', () => {
        return {
          resetIndexerData: stubbedResetIndexerData
        }
      })

      jest.doMock('../../src/block-sync-renderer/task', () => {
        return stubbedSyncTaskCtor
      })

      jest.doMock('child_process', () => {
        return {
          fork: stubbedFork
        }
      })

      jest.doMock('utils/logger', () => {
        return {
          info: stubbedLoggerInfo,
          debug: stubbedLoggerDebug,
          error: stubbedLoggerError,
        }
      })

      jest.doMock('utils/worker', () => {
        return {
          spawn: () => ({
            queryIndexer: stubbedQueryIndexer,
            unmount: stubbedUnmountSyncTask,
            start: stubbedSyncTaskStart
          }),
          subscribe: (_: any, cb: (...args: any[]) => void) => {
            childProcessEmiter.on('message', cb)
          },
          terminate: jest.fn()
        }
      })

      jest.doMock('models/synced-block-number', () => {
        return jest.fn().mockImplementation(
          () => ({
            setNextBlock: jest.fn(),
            getNextBlock: () => ''
          })
        )
      })

      jest.doMock('services/addresses', () => {
        return {
          updateTxCountAndBalances: jest.fn(),
          updateUsedByAnyoneCanPayByBlake160s: jest.fn(),
          getAddressesByAllWallets: () => [{}]
        }
      })

      jest.doMock('services/networks', () => {
        return {
          getInstance: () => ({
            getCurrent: stubbedGetCurrentNetwork
          }),
        }
      })

      jest.doMock('services/wallets', () => {
        return {
          getInstance: () => ({
            maintainAddressesIfNecessary: stubbedmaintainAddressesIfNecessary
          }),
        }
      })

      jest.doMock('utils/common', () => {
        return {
          sleep: jest.fn()
        }
      })

      jest.doMock('models/subjects/data-update', () => {
        return {
          next: stubbedDataUpdateSubject
        }
      })

      jest.doMock('controllers/sync-api', () => {
        return {
          emiter: {
            emit: stubbedSyncApiControllerEmitter
          }
        }
      })

      jest.doMock('models/subjects/tx-db-changed-subject', () => {
        return {
          getSubject: () => ({
            next: stubbedTxDbChangedSubjectNext
          })
        }
      })

      jest.doMock('models/subjects/address-db-changed-subject', () => {
        return {
          getSubject: () => ({
            next: stubbedAddressDbChangedSubjectNext
          })
        }
      })

      stubbedGetCurrentNetwork.mockReturnValue(network)

      queryIndexer = require('../../src/block-sync-renderer').queryIndexer
      createBlockSyncTask = require('../../src/block-sync-renderer').createBlockSyncTask
      resetSyncTask = require('../../src/block-sync-renderer').resetSyncTask
    });
    afterEach(() => {
      jest.clearAllTimers()
    });
    it('subscribes to #AddressCreatedSubject and #WalletDeletedSubject', () => {
      expect(stubbedAddressCreatedSubjectSubscribe).toHaveBeenCalled()
      expect(stubbedWalletDeletedSubjectSubscribe).toHaveBeenCalled()
    })

    describe('with child process created for sync task', () => {
      const stubbedSetEncodingForStderr = jest.fn()

      let stderrEmitter: EventEmitter

      beforeEach(async () => {
        stderrEmitter = new EventEmitter()
        stubbedFork.mockImplementation(
          () => ({
            stderr: {
              setEncoding: stubbedSetEncodingForStderr.mockImplementation(() => stderrEmitter)
            },
          })
        )
        await resetSyncTask(true)
      });

      it('should not reset indexer data', async () => {
        expect(stubbedResetIndexerData).not.toHaveBeenCalled()
      })

      it('generates addresses', async () => {
        expect(stubbedmaintainAddressesIfNecessary).toHaveBeenCalled()
      })

      it('sync task can be start over by early return', async () => {
        expect(async () => {
          await createBlockSyncTask(true)
        }).not.toThrow()
      })

      it('updates transaction', () => {
        expect(stubbedDataUpdateSubject).toHaveBeenCalledWith({
          dataType: 'transaction',
          actionType: 'update',
        })
      })

      it('starts sync task', () => {
        expect(stubbedSyncTaskStart).toHaveBeenCalled()
      })

      describe('catches error logs from child process', () => {
        beforeEach(async () => {
          stderrEmitter.emit('data', 'stderr')
        });
        it('logs for stderr from child process', () => {
          expect(stubbedLoggerError).toHaveBeenCalledWith('Sync:ChildProcess:', 'stderr')
        })
      });

      describe('#queryIndexer', () => {
        const query: LumosCellQuery = {lock: null, type: null, data: null}
        let results: any
        describe('when returns non empty result from SyncTask.queryIndexer', () => {
          beforeEach(async () => {
            stubbedQueryIndexer.mockResolvedValueOnce([{}])
            results = await queryIndexer(query)
          });
          it('returns data array', () => {
            expect(results).toEqual([{}])
          })
        });
        describe('when returns undefined from SyncTask.queryIndexer', () => {
          beforeEach(async () => {
            stubbedQueryIndexer.mockResolvedValueOnce(undefined)
            results = await queryIndexer(query)
          });
          it('returns empty array', () => {
            expect(results).toEqual([])
          })
        });
        describe('when throws error', () => {
          beforeEach(async () => {
            stubbedQueryIndexer.mockRejectedValueOnce({})
            results = await queryIndexer(query)
          });
          it('returns empty array', () => {
            expect(results).toEqual([])
          })
        });
      });
      describe('#switchToNetwork', () => {
        let switchToNetwork: any

        describe('after created a sync task and switched to a network', () => {
          beforeEach(async () => {
            switchToNetwork = require('../../src/block-sync-renderer').switchToNetwork
            await switchToNetwork(network)
            stubbedSyncTaskStart.mockReset()
            stubbedUnmountSyncTask.mockReset()
            stubbedmaintainAddressesIfNecessary.mockReset()
          })

          describe('switches to different network', () => {
            beforeEach(async () => {
              await switchToNetwork({id: 'id2', genesisHash: 'hash'})
            });
            it('restarts sync task', async () => {
              expect(stubbedUnmountSyncTask).toHaveBeenCalled()
              expect(stubbedSyncTaskStart).toHaveBeenCalled()
            })
            it('checks and generates addresses if necessary', () => {
              expect(stubbedmaintainAddressesIfNecessary).toHaveBeenCalled()
            })
          });

          describe('switches to same network', () => {
            beforeEach(async () => {
              await switchToNetwork(network)
            });
            it('should not trigger operations on sync task', async () => {
              expect(stubbedUnmountSyncTask).not.toHaveBeenCalled()
              expect(stubbedSyncTaskStart).not.toHaveBeenCalled()
            })
            it('should not generate addresses', () => {
              expect(stubbedmaintainAddressesIfNecessary).not.toHaveBeenCalled()
            })
          });

          describe('forces reconnecting to same network', () => {
            beforeEach(async () => {
              await switchToNetwork(network, true)
            });
            it(`triggers operations on sync task`, async () => {
              expect(stubbedUnmountSyncTask).toHaveBeenCalled()
              expect(stubbedSyncTaskStart).toHaveBeenCalled()
            })
            it('checks and generates addresses if necessary', () => {
              expect(stubbedmaintainAddressesIfNecessary).toHaveBeenCalled()
            })
          });

          it(`should not create sync task if genesis hash don't match`, async () => {
            await switchToNetwork(network, true, false)
            expect(stubbedUnmountSyncTask).toHaveBeenCalled()
            expect(stubbedSyncTaskStart).not.toHaveBeenCalled()
          })
        });
      })

      describe('subscribe message from child process', () => {
        const fakeSendMessageToMainProcess = (channel: string, result: any) => {
          childProcessEmiter.emit('message', {
            channel,
            result
          })
        }
        let result: any
        beforeEach(() => {
          result = { event: '' }
        });

        describe('handles tx-db-changed event from child process', () => {
          beforeEach(() => {
            fakeSendMessageToMainProcess('tx-db-changed', result)
          });
          it('TxDbChangedSubject change in the main process', () => {
            expect(stubbedTxDbChangedSubjectNext).toHaveBeenCalledWith(result)
          })
        });
        describe('handles address-db-changed event from child process', () => {
          beforeEach(() => {
            fakeSendMessageToMainProcess('address-db-changed', result)
          });
          it('AddressDbChangedSubject change in the main process', () => {
            expect(stubbedAddressDbChangedSubjectNext).toHaveBeenCalledWith(result)
          })
        });
        describe('handles cache-tip-block-updated event from child process', () => {
          beforeEach(() => {
            fakeSendMessageToMainProcess('cache-tip-block-updated', result)
          });
          it('SyncApiController emiter message in the main process', ()=> {
            expect(stubbedSyncApiControllerEmitter).toHaveBeenCalledWith('cache-tip-block-updated', result)
          })
        });
        describe('handles wallet-deleted event from child process', () => {
          beforeEach(async () => {
            stubbedUnmountSyncTask.mockReset()
            stubbedSyncTaskStart.mockReset()
            fakeSendMessageToMainProcess('wallet-deleted', result)
            await flushPromises()
          });
          it('resets sync task', ()=> {
            expect(stubbedUnmountSyncTask).toHaveBeenCalledTimes(1)
            expect(stubbedSyncTaskStart).toHaveBeenCalledTimes(1)
          })
        });
        describe('handles address-created event from child process', () => {
          beforeEach(async () => {
            stubbedUnmountSyncTask.mockReset()
            stubbedSyncTaskStart.mockReset()
            fakeSendMessageToMainProcess('address-created', result)
            await flushPromises()
          });
          it('resets sync task', ()=> {
            expect(stubbedUnmountSyncTask).toHaveBeenCalledTimes(1)
            expect(stubbedSyncTaskStart).toHaveBeenCalledTimes(1)
          })
        });
      })
      describe('with parallel calls', () => {

        beforeEach(async () => {
          stubbedSyncTaskStart.mockReset()
          await Promise.all([
            resetSyncTask(true),
            resetSyncTask(true),
            resetSyncTask(),
          ])
        })
        it('only allows one call passed through among multiple calls, ignoreing the rest', () => {
          expect(stubbedSyncTaskStart).toHaveBeenCalledTimes(1)
        });
      });
    })

    describe('reset sync task and clear indexer folder', () => {
      beforeEach(async () => {
        const clearIndexerFolder = true
        await resetSyncTask(true, clearIndexerFolder)
      });
      it('resets indexer data', async () => {
        expect(stubbedResetIndexerData).toHaveBeenCalled()
      })
    });

  });
  describe('in renderer process', () => {
    beforeEach(() => {
      jest.resetModules()
      jest.doMock('electron', () => {
        return {BrowserWindow: undefined}
      });
      require('../../src/block-sync-renderer')
    });
    it('should not subscribe to #AddressCreatedSubject and #WalletDeletedSubject', () => {
      expect(stubbedAddressCreatedSubjectSubscribe).toHaveBeenCalledTimes(0)
      expect(stubbedWalletDeletedSubjectSubscribe).toHaveBeenCalledTimes(0)
    });
  });
});

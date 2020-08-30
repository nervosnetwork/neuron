import { EventEmitter } from 'events'
import { LumosCellQuery } from "../../src/block-sync-renderer/sync/indexer-connector"

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

const childProcessEmiter = new EventEmitter()

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

  stubbedIpcMainOnce.mockReset()
  stubbedQueryIndexer.mockReset()
  stubbedResetIndexerData.mockReset()
  stubbedGetCurrentNetwork.mockReset()

  stubbedUnmountSyncTask.mockRestore()
  stubbedSyncTaskStart.mockRestore()
}

describe('block sync render', () => {
  describe('in main process', () => {
    let queryIndexer: any
    let createBlockSyncTask: any
    let killBlockSyncTask: any

    const network = {
      id: 'id',
      genesisHash: '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5'
    }

    beforeEach(async () => {
      resetMocks()
      jest.useFakeTimers()

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
          fork: jest.fn()
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
      killBlockSyncTask = require('../../src/block-sync-renderer').killBlockSyncTask
    });
    afterEach(() => {
      jest.clearAllTimers()
    });
    it('subscribes to #AddressCreatedSubject and #WalletDeletedSubject', () => {
      expect(stubbedAddressCreatedSubjectSubscribe).toHaveBeenCalled()
      expect(stubbedWalletDeletedSubjectSubscribe).toHaveBeenCalled()
    })
    describe('after initialized BrowserWindow', () => {
      beforeEach(() => {
        createBlockSyncTask()
        jest.advanceTimersByTime(2000)
      });
      describe('#queryIndexer', () => {
        const query: LumosCellQuery = {lock: null, type: null, data: null}
        beforeEach(() => {
          queryIndexer(query)
        });
        it('called with SyncTask instance', () => {
          expect(stubbedQueryIndexer).toHaveBeenCalledWith(query)
        })
      });
    });

    describe('#createBlockSyncTask', () => {
      beforeEach(async () => {
        await createBlockSyncTask(true)
      });

      afterEach(async () => {
        await killBlockSyncTask()
      })

      it('reset indexer data', async () => {
        expect(stubbedResetIndexerData).toHaveBeenCalled()
      })

      it('sync task can be start over by early return', async () => {
        expect(async () => {
          await createBlockSyncTask(true)
        }).not.toThrow()
      })

      it('should update transaction', () => {
        expect(stubbedDataUpdateSubject).toHaveBeenCalledWith({
          dataType: 'transaction',
          actionType: 'update',
        })
      })

      it('should start sync task', () => {
        expect(stubbedSyncTaskStart).toHaveBeenCalled()
      })
    })

    describe('#switchToNetwork', () => {
      let switchToNetwork: any

      describe('after created a sync task and switched to a network', () => {
        beforeEach(async () => {
          switchToNetwork = require('../../src/block-sync-renderer').switchToNetwork
          await createBlockSyncTask()
          await switchToNetwork(network)
          stubbedSyncTaskStart.mockReset()
          stubbedUnmountSyncTask.mockReset()
        })

        describe('switches to different network', () => {
          beforeEach(async () => {
            await switchToNetwork({id: 'id2', genesisHash: 'hash'})
          });
          it('restarts sync task', async () => {
            expect(stubbedUnmountSyncTask).toHaveBeenCalled()
            expect(stubbedSyncTaskStart).toHaveBeenCalled()
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
        });

        describe('forces reconnecting to same network', () => {
          beforeEach(async () => {
            await switchToNetwork(network, true)
          });
          it(`triggers operations on sync task`, async () => {
            expect(stubbedUnmountSyncTask).toHaveBeenCalled()
            expect(stubbedSyncTaskStart).toHaveBeenCalled()
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
      const result = { event: '' }

      beforeEach(async () => {
        await createBlockSyncTask(true)
      })

      afterEach(() => {
        stubbedTxDbChangedSubjectNext.mockRestore()
        stubbedAddressDbChangedSubjectNext.mockRestore()
        stubbedSyncApiControllerEmitter.mockRestore()
      })

      it('TxDbChangedSubject change in the main process', () => {
        fakeSendMessageToMainProcess('tx-db-changed', result)
        expect(stubbedTxDbChangedSubjectNext).toHaveBeenCalledWith(result)
      })

      it('AddressDbChangedSubject change in the main process', () => {
        fakeSendMessageToMainProcess('address-db-changed', result)
        expect(stubbedAddressDbChangedSubjectNext).toHaveBeenCalledWith(result)
      })

      it('SyncApiController emiter message in the main process', ()=> {
        fakeSendMessageToMainProcess('synced-block-number-updated', result)
        expect(stubbedSyncApiControllerEmitter).toHaveBeenCalledWith('synced-block-number-updated', result)
      })
    })
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

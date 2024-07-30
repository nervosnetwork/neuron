import Emitter from 'events'
import { flushPromises } from '../test-utils'

const stubbedEmitter = jest.fn(() => {
  const SyncAPIController = jest.requireActual('../../src/controllers/sync-api').default
  return SyncAPIController.emiter
})
const stubbedSyncedBlockNumber = jest.fn()
const stubbedSyncStateSubjectNext = jest.fn()
const stubbedGetSyncState = jest.fn()
const stubbedSetNextBlock = jest.fn()

const stubbedRpcServiceConstructor = jest.fn()
const stubbedCurrentBlockNumber = jest.fn()
const stubbedGetLatestConnectionStatus = jest.fn()
const stubbedGetTipHeader = jest.fn()
const stubbedCurrentNetworkIDSubject = jest.fn()
const stubbedDateNow = jest.fn()
const getCurrentNetworkMock = jest.fn()

const resetMocks = () => {
  stubbedEmitter.mockReset()
  stubbedSyncedBlockNumber.mockReset()
  stubbedSyncStateSubjectNext.mockReset()
  stubbedGetSyncState.mockReset()
  stubbedSetNextBlock.mockReset()
  stubbedCurrentBlockNumber.mockReset()
  stubbedGetLatestConnectionStatus.mockReset()
  stubbedGetTipHeader.mockReset()
  stubbedCurrentNetworkIDSubject.mockReset()
  stubbedDateNow.mockReset()
  getCurrentNetworkMock.mockReset()
}

let networkChangedCallback: any
jest.doMock('models/subjects/networks', () => {
  return {
    CurrentNetworkIDSubject: {
      pipe: () => ({
        subscribe: (callback: any) => {
          networkChangedCallback = callback
        },
      }),
    },
  }
})
jest.mock('services/multisig', () => ({
  syncMultisigOutput: () => jest.fn(),
}))
jest.mock('env', () => ({
  app: {
    isPackaged: true,
  },
}))

describe('SyncApiController', () => {
  const emitter = new Emitter()
  const fakeNodeUrl = 'http://fakenodeurl'
  let controller: any
  Date.now = stubbedDateNow

  const sendFakeCacheBlockTipEvent = async (event: any) => {
    stubbedDateNow.mockReturnValue(Number(event.timestamp))
    emitter.emit('cache-tip-block-updated', event)
    await flushPromises()
  }

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers('legacy')

    jest.doMock('services/indexer', () => ({ LISTEN_URI: 'stub_listen_uri' }))

    jest.doMock('models/synced-block-number', () => {
      return stubbedSyncedBlockNumber
    })
    jest.doMock('models/subjects/sync-state-subject', () => {
      return { next: stubbedSyncStateSubjectNext }
    })
    jest.doMock('models/synced-block-number', () => {
      return jest.fn().mockImplementation(() => {
        return { setNextBlock: stubbedSetNextBlock }
      })
    })
    jest.doMock('services/networks', () => {
      return {
        getInstance: () => ({
          getCurrent: getCurrentNetworkMock,
        }),
      }
    })

    jest.doMock('../../src/models/subjects/node', () => {
      return {
        getLatestConnectionStatus: stubbedGetLatestConnectionStatus,
      }
    })
    jest.doMock('../../src/services/rpc-service', () => {
      return {
        __esModule: true,
        default: stubbedRpcServiceConstructor.mockImplementation(() => ({
          getTipHeader: stubbedGetTipHeader,
          getSyncState: stubbedGetSyncState,
        })),
      }
    })

    stubbedEmitter.mockImplementation(() => {
      return emitter
    })

    emitter.removeAllListeners()
    const SyncAPIController = require('../../src/controllers/sync-api').default
    // TODO: starting from jest@29.4.0 or above, you can use `jest.replaceProperty` as an alternative implementation.
    Object.defineProperty(SyncAPIController, 'emiter', { get: stubbedEmitter })
    controller = new SyncAPIController()
    controller.mount()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('updates sync status', () => {
    const bestKnownBlockNumber = 10000
    const bestKnownBlockTimestamp = 246000
    beforeEach(() => {
      stubbedDateNow.mockReturnValue(246000)
      stubbedGetSyncState.mockResolvedValue({
        bestKnownBlockNumber: bestKnownBlockNumber.toString(16),
        bestKnownBlockTimestamp: `0x${bestKnownBlockTimestamp.toString(16)}`,
      })
      getCurrentNetworkMock.mockReturnValue({ remote: fakeNodeUrl, type: 0 })
      stubbedGetTipHeader.mockResolvedValue({ timestamp: '180000' })
    })
    describe('on cache-tip-block-updated', () => {
      describe('when completed cache', () => {
        const cacheTipNumber = (bestKnownBlockNumber - 4).toString()
        const fakeState1 = {
          cacheTipNumber,
          indexerTipNumber: bestKnownBlockNumber.toString(),
          timestamp: '186000',
        }
        const fakeState2 = {
          cacheTipNumber,
          indexerTipNumber: bestKnownBlockNumber.toString(),
          timestamp: '187000',
        }
        beforeEach(async () => {
          process.env.CKB_NODE_ASSUME_VALID_TARGET = '0x'
          process.env.CKB_NODE_ASSUME_VALID_TARGET_BLOCK_NUMBER = '100000'
          await sendFakeCacheBlockTipEvent(fakeState1)
          await sendFakeCacheBlockTipEvent(fakeState2)
        })
        afterAll(() => {
          delete process.env['CKB_NODE_ASSUME_VALID_TARGET']
          delete process.env['CKB_NODE_ASSUME_VALID_TARGET_BLOCK_NUMBER']
        })
        it('broadcast event of synced', () => {
          expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
            nodeUrl: fakeNodeUrl,
            timestamp: parseInt(fakeState2.timestamp),
            bestKnownBlockNumber,
            bestKnownBlockTimestamp,
            cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
            indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
            indexRate: undefined,
            cacheRate: undefined,
            estimate: undefined,
            status: 3,
            isLookingValidTarget: true,
            validTarget: '0x',
          })
        })
        it('#getSyncStatus returns synced', async () => {
          const syncStatus = await controller.getSyncStatus()
          expect(syncStatus).toEqual(3)
        })
        it('stores next block number', () => {
          expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
        })
      })

      describe('when tip header is out of sync for a while', () => {
        const cacheTipNumber = (bestKnownBlockNumber - 4).toString()
        const fakeState1 = {
          cacheTipNumber,
          indexerTipNumber: bestKnownBlockNumber.toString(),
          timestamp: '186000',
        }
        const fakeState2 = {
          cacheTipNumber,
          indexerTipNumber: bestKnownBlockNumber.toString(),
          timestamp: '187000',
        }
        beforeEach(async () => {
          await sendFakeCacheBlockTipEvent(fakeState1)
          stubbedGetTipHeader.mockResolvedValue({ timestamp: '1' })
          await sendFakeCacheBlockTipEvent(fakeState2)
        })
        it('broadcast event of syncing', () => {
          expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
            nodeUrl: fakeNodeUrl,
            timestamp: parseInt(fakeState2.timestamp),
            bestKnownBlockNumber,
            bestKnownBlockTimestamp,
            cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
            indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
            indexRate: undefined,
            cacheRate: undefined,
            estimate: undefined,
            status: 2,
            isLookingValidTarget: false,
          })
        })
        it('#getSyncStatus returns syncing', async () => {
          const syncStatus = await controller.getSyncStatus()
          expect(syncStatus).toEqual(2)
        })
      })

      describe('when tip header timestamp is ten minutes earlier than current timestamp', () => {
        const cacheTipNumber = (bestKnownBlockNumber - 4).toString()
        const fakeState1 = {
          cacheTipNumber,
          indexerTipNumber: bestKnownBlockNumber.toString(),
          timestamp: '606000',
        }
        const fakeState2 = {
          cacheTipNumber,
          indexerTipNumber: bestKnownBlockNumber.toString(),
          timestamp: '607000',
        }
        beforeEach(async () => {
          await sendFakeCacheBlockTipEvent(fakeState1)
          stubbedGetTipHeader.mockResolvedValue({ timestamp: '1' })
          await sendFakeCacheBlockTipEvent(fakeState2)
        })
        it('broadcast event of sync pending', () => {
          expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
            nodeUrl: fakeNodeUrl,
            timestamp: parseInt(fakeState2.timestamp),
            bestKnownBlockNumber,
            bestKnownBlockTimestamp,
            cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
            indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
            indexRate: undefined,
            cacheRate: undefined,
            estimate: undefined,
            status: 1,
            isLookingValidTarget: false,
          })
        })
        it('#getSyncStatus returns sync pending', async () => {
          const syncStatus = await controller.getSyncStatus()
          expect(syncStatus).toEqual(1)
        })
      })

      describe('when cache is still ongoing', () => {
        const cacheTipNumber = (bestKnownBlockNumber - 5).toString()
        describe('with only one sample', () => {
          const fakeState1 = {
            cacheTipNumber,
            indexerTipNumber: bestKnownBlockNumber.toString(),
            timestamp: '186000',
          }
          beforeEach(async () => {
            await sendFakeCacheBlockTipEvent(fakeState1)
          })
          it('should not calculate estimation', () => {
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState1.timestamp),
              bestKnownBlockNumber,
              bestKnownBlockTimestamp,
              cacheTipNumber: parseInt(fakeState1.cacheTipNumber),
              indexerTipNumber: parseInt(fakeState1.indexerTipNumber),
              indexRate: undefined,
              cacheRate: undefined,
              estimate: undefined,
              status: 2,
              isLookingValidTarget: false,
            })
          })
          it('stores next block number', () => {
            expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
          })
          it('#getSyncStatus returns syncing', async () => {
            const syncStatus = await controller.getSyncStatus()
            expect(syncStatus).toEqual(2)
          })
        })
        describe('when advanced indexer tip is greater or equals to 50', () => {
          const fakeState1 = {
            cacheTipNumber,
            indexerTipNumber: (bestKnownBlockNumber - 102).toString(),
            timestamp: '186000',
          }
          const fakeState2 = {
            cacheTipNumber,
            indexerTipNumber: (bestKnownBlockNumber - 51).toString(),
            timestamp: '187000',
          }
          const indexRate = 51 / (parseInt(fakeState2.timestamp) - parseInt(fakeState1.timestamp))
          const expectedEstimation = {
            nodeUrl: fakeNodeUrl,
            timestamp: parseInt(fakeState2.timestamp),
            bestKnownBlockNumber,
            bestKnownBlockTimestamp,
            cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
            indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
            indexRate,
            cacheRate: undefined,
            estimate: Math.round((bestKnownBlockNumber - parseInt(fakeState2.indexerTipNumber)) / indexRate),
            status: 2,
            isLookingValidTarget: false,
          }
          beforeEach(async () => {
            await sendFakeCacheBlockTipEvent(fakeState1)
            await sendFakeCacheBlockTipEvent(fakeState2)
          })
          it('calculates estimation', () => {
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith(expectedEstimation)
          })
          it('stores next block number', () => {
            expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
          })
          it('#getSyncStatus returns syncing', async () => {
            const syncStatus = await controller.getSyncStatus()
            expect(syncStatus).toEqual(2)
          })
          describe('#getCachedEstimate', () => {
            let cachedEstimate: any
            const newFakeState = {
              ...fakeState2,
              cacheTipNumber: (Number(fakeState2.cacheTipNumber) + 1).toString(),
              timestamp: '196000',
            }
            beforeEach(() => {
              cachedEstimate = controller.getCachedEstimation()
            })
            it('returns the last estimate', () => {
              expect(cachedEstimate).toEqual(expectedEstimation)
            })
            describe('with additional estimation', () => {
              beforeEach(async () => {
                await sendFakeCacheBlockTipEvent(newFakeState)
                cachedEstimate = await controller.getCachedEstimation()
              })
              it('still returns the last cached estimate', () => {
                expect(cachedEstimate).toEqual(expectedEstimation)
              })
              describe('with a minute over the cached timestamp', () => {
                beforeEach(async () => {
                  stubbedDateNow.mockReturnValue(Number(fakeState2.timestamp) + 60000)
                  cachedEstimate = await controller.getCachedEstimation()
                })
                it('still returns the newly cached estimate', () => {
                  expect(cachedEstimate).toEqual(expect.objectContaining({ timestamp: Number(newFakeState.timestamp) }))
                })
              })
              describe('with another node url', () => {
                beforeEach(async () => {
                  getCurrentNetworkMock.mockReturnValue({ remote: 'anotherfakeurl' })
                  await sendFakeCacheBlockTipEvent(newFakeState)

                  cachedEstimate = await controller.getCachedEstimation()
                })
                it('returns the newly cached estimate', () => {
                  expect(cachedEstimate).toEqual(expect.objectContaining({ timestamp: Number(newFakeState.timestamp) }))
                })
              })
              describe('with same additional estimation', () => {
                beforeEach(async () => {
                  await sendFakeCacheBlockTipEvent(newFakeState)
                  cachedEstimate = await controller.getCachedEstimation()
                })
                it('returns the newly cached estimate', () => {
                  expect(cachedEstimate).toEqual(expect.objectContaining({ timestamp: Number(newFakeState.timestamp) }))
                })
              })
            })
          })
        })
        describe('when advanced indexer tip is less than 50', () => {
          const fakeState1 = {
            cacheTipNumber,
            indexerTipNumber: (bestKnownBlockNumber - 50).toString(),
            timestamp: '186000',
          }
          const fakeState2 = {
            cacheTipNumber,
            indexerTipNumber: (bestKnownBlockNumber - 1).toString(),
            timestamp: '187000',
          }
          beforeEach(async () => {
            await sendFakeCacheBlockTipEvent(fakeState1)
            await sendFakeCacheBlockTipEvent(fakeState2)
          })
          it('should not calculate estimation', () => {
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState2.timestamp),
              bestKnownBlockNumber,
              bestKnownBlockTimestamp,
              cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
              indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
              indexRate: undefined,
              cacheRate: undefined,
              estimate: undefined,
              status: 2,
              isLookingValidTarget: false,
            })
          })
          it('stores next block number', () => {
            expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
          })
          it('#getSyncStatus returns syncing', async () => {
            const syncStatus = await controller.getSyncStatus()
            expect(syncStatus).toEqual(2)
          })
        })
        describe('with samples spanning over 1 min', () => {
          const fakeState1 = {
            cacheTipNumber,
            indexerTipNumber: '100',
            timestamp: '181000',
          }
          const fakeState2 = {
            cacheTipNumber,
            indexerTipNumber: '200',
            timestamp: '186000',
          }
          const fakeState3 = {
            cacheTipNumber,
            indexerTipNumber: '6201',
            timestamp: '246000',
          }
          beforeEach(async () => {
            stubbedSyncStateSubjectNext.mockReset()
            await sendFakeCacheBlockTipEvent(fakeState1)
            await sendFakeCacheBlockTipEvent(fakeState2)
            await sendFakeCacheBlockTipEvent(fakeState3)
          })
          it('estimates with samples in the last minute', () => {
            const indexRate =
              (parseInt(fakeState3.indexerTipNumber) - parseInt(fakeState2.indexerTipNumber)) /
              (parseInt(fakeState3.timestamp) - parseInt(fakeState2.timestamp))
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState3.timestamp),
              bestKnownBlockNumber,
              bestKnownBlockTimestamp,
              indexRate,
              cacheRate: undefined,
              cacheTipNumber: parseInt(fakeState3.cacheTipNumber),
              indexerTipNumber: parseInt(fakeState3.indexerTipNumber),
              estimate: Math.round((bestKnownBlockNumber - parseInt(fakeState3.indexerTipNumber)) / indexRate),
              status: 2,
              isLookingValidTarget: false,
            })
          })
          it('stores next block number', () => {
            expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
          })
          it('#getSyncStatus returns syncing', async () => {
            const syncStatus = await controller.getSyncStatus()
            expect(syncStatus).toEqual(2)
          })
          describe('when node url changed', () => {
            beforeEach(async () => {
              getCurrentNetworkMock.mockReturnValue({ remote: 'http://diffurl' })
              await sendFakeCacheBlockTipEvent(fakeState3)
            })
            it('resets samples', () => {
              expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
                nodeUrl: 'http://diffurl',
                timestamp: parseInt(fakeState3.timestamp),
                bestKnownBlockNumber,
                bestKnownBlockTimestamp,
                indexRate: undefined,
                cacheRate: undefined,
                cacheTipNumber: parseInt(fakeState3.cacheTipNumber),
                indexerTipNumber: parseInt(fakeState3.indexerTipNumber),
                estimate: undefined,
                status: 2,
                isLookingValidTarget: false,
              })
            })
            it('#getSyncStatus returns syncing', async () => {
              const syncStatus = await controller.getSyncStatus()
              expect(syncStatus).toEqual(2)
            })
          })
        })
      })

      describe('when searching best known block number is in progress', () => {
        const cacheTipNumber = bestKnownBlockNumber.toString()
        const fakeState1 = {
          cacheTipNumber,
          indexerTipNumber: (bestKnownBlockNumber - 101).toString(),
          timestamp: '186000',
        }

        const nextBestKnownBlockNumber = bestKnownBlockNumber + 50
        const fakeState2 = {
          cacheTipNumber: nextBestKnownBlockNumber.toString(),
          indexerTipNumber: (bestKnownBlockNumber - 50).toString(),
          timestamp: '187000',
        }
        beforeEach(async () => {
          await sendFakeCacheBlockTipEvent(fakeState1)
          stubbedGetSyncState.mockResolvedValue({
            bestKnownBlockNumber: nextBestKnownBlockNumber.toString(16),
            bestKnownBlockTimestamp: bestKnownBlockTimestamp,
          })
          await sendFakeCacheBlockTipEvent(fakeState2)
        })
        it('should not calculate estimation', () => {
          expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
            nodeUrl: fakeNodeUrl,
            timestamp: parseInt(fakeState2.timestamp),
            bestKnownBlockNumber: nextBestKnownBlockNumber,
            bestKnownBlockTimestamp,
            cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
            indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
            indexRate: undefined,
            cacheRate: undefined,
            estimate: undefined,
            status: 2,
            isLookingValidTarget: false,
          })
        })
        it('#getSyncStatus returns syncing', async () => {
          const syncStatus = await controller.getSyncStatus()
          expect(syncStatus).toEqual(2)
        })
      })
    })

    describe('when got CurrentNetworkIDSubject event', () => {
      beforeEach(async () => {
        networkChangedCallback()
      })
      it('broadcast event of sync not started', () => {
        expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
          nodeUrl: fakeNodeUrl,
          timestamp: 0,
          bestKnownBlockNumber: 0,
          bestKnownBlockTimestamp: 0,
          cacheTipNumber: 0,
          indexerTipNumber: 0,
          indexRate: undefined,
          cacheRate: undefined,
          estimate: undefined,
          status: 0,
        })
      })
      it('#getSyncStatus returns not started', async () => {
        const syncStatus = await controller.getSyncStatus()
        expect(syncStatus).toEqual(0)
      })
    })
  })
})

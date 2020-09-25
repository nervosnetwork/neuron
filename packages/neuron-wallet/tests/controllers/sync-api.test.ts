import Emitter from 'events'
import { flushPromises } from '../test-utils'

const stubbedEmitter = jest.fn()
const stubbedSyncedBlockNumber = jest.fn()
const stubbedSyncStateSubjectNext = jest.fn()
const stubbedSDKMethod = jest.fn()
const stubbedNodeGetInstance = jest.fn()

const resetMocks = () => {
  stubbedEmitter.mockReset()
  stubbedSyncedBlockNumber.mockReset()
  stubbedSyncStateSubjectNext.mockReset()
  stubbedSDKMethod.mockReset()
  stubbedNodeGetInstance.mockReset()
}

describe('sync api', () => {
  const emitter = new Emitter()
  const fakeNodeUrl = 'http://fakenodeurl'
  let controller: any

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers()

    jest.doMock('events', () => {
      return stubbedEmitter
    })
    jest.doMock('models/synced-block-number', () => {
      return stubbedSyncedBlockNumber
    })
    jest.doMock('models/subjects/sync-state-subject', () => {
      return {next: stubbedSyncStateSubjectNext}
    })
    jest.doMock('services/node', () => {
      return {
        getInstance: stubbedNodeGetInstance
      }
    })
    jest.doMock('@nervosnetwork/ckb-sdk-rpc/lib/method', () => {
      return jest.fn().mockImplementation(() => {
        return {
          call: stubbedSDKMethod
        }
      })
    })

    stubbedEmitter.mockImplementation(() => {
      return emitter
    })

    emitter.removeAllListeners()
    const SyncAPIController = require('../../src/controllers/sync-api').default
    controller = new SyncAPIController()
    controller.mount()
  });

  afterEach(() => {
    jest.clearAllTimers()
  });

  describe('on sync-states-updated', () => {
    const bestKnownBlockNumber = 10000
    beforeEach(() => {
      jest
        .spyOn(Date, 'now')
        .mockImplementation(() => 66000);
      stubbedSDKMethod.mockResolvedValue({best_known_block_number: bestKnownBlockNumber.toString(16)})
      stubbedNodeGetInstance.mockImplementation(() => ({
        ckb: {
          // rpc: {
          //   syncState: stubbedSyncState
          // },
          node: {
            url: fakeNodeUrl
          }
        }
      }))
    });
    describe('estimate based on rate of indexing', () => {
      describe('when completed cache', () => {
        const cacheTip = (bestKnownBlockNumber - 4).toString()
        const fakeState1 = {
          cacheTip,
          indexerTip: (bestKnownBlockNumber - 50).toString(),
          timestamp: '6000',
        }
        beforeEach(async () => {
          emitter.emit('sync-states-updated', fakeState1)
          await flushPromises()
        });
        it('indicates synced', () => {
          expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
            nodeUrl: fakeNodeUrl,
            timestamp: parseInt(fakeState1.timestamp),
            bestKnownBlockNumber,
            cacheTip: parseInt(fakeState1.cacheTip),
            indexerTip: parseInt(fakeState1.indexerTip),
            indexRate: undefined,
            cacheRate: undefined,
            estimate: undefined,
            synced: true,
          })
        })
        describe('when advanced indexer tip is greater or equals to 50', () => {
          const fakeState2 = {
            cacheTip,
            indexerTip: bestKnownBlockNumber.toString(),
            timestamp: '7000',
          }
          beforeEach(async () => {
            emitter.emit('sync-states-updated', fakeState2)
            await flushPromises()
          });
          it('indicates synced', () => {
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState2.timestamp),
              bestKnownBlockNumber,
              cacheTip: parseInt(fakeState2.cacheTip),
              indexerTip: parseInt(fakeState2.indexerTip),
              indexRate: undefined,
              cacheRate: undefined,
              estimate: undefined,
              synced: true,
            })
          })
        });
      });
      describe('when cache is still ongoing', () => {
        const cacheTip = (bestKnownBlockNumber - 5).toString()
        describe('with only one sample', () => {
          const fakeState1 = {
            cacheTip,
            indexerTip: bestKnownBlockNumber.toString(),
            timestamp: '6000',
          }
          beforeEach(async () => {
            stubbedSyncStateSubjectNext.mockReset()
            emitter.emit('sync-states-updated', fakeState1)
            await flushPromises()
          });
          it('indicates either estimating or synced', () => {
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState1.timestamp),
              bestKnownBlockNumber,
              cacheTip: parseInt(fakeState1.cacheTip),
              indexerTip: parseInt(fakeState1.indexerTip),
              indexRate: undefined,
              cacheRate: undefined,
              estimate: undefined,
              synced: false,
            })
          })
        });
        describe('when advanced indexer tip is greater or equals to 50', () => {
          const fakeState1 = {
            cacheTip,
            indexerTip: (bestKnownBlockNumber - 51).toString(),
            timestamp: '6000',
          }
          const fakeState2 = {
            cacheTip,
            indexerTip: (bestKnownBlockNumber - 1).toString(),
            timestamp: '7000',
          }
          beforeEach(async () => {
            emitter.emit('sync-states-updated', fakeState1)
            emitter.emit('sync-states-updated', fakeState2)
            await flushPromises()
          });
          it('indicates synced', () => {
            const indexRate = 50 / (parseInt(fakeState2.timestamp) - parseInt(fakeState1.timestamp))
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState2.timestamp),
              bestKnownBlockNumber,
              cacheTip: parseInt(fakeState2.cacheTip),
              indexerTip: parseInt(fakeState2.indexerTip),
              indexRate,
              cacheRate: undefined,
              estimate: (bestKnownBlockNumber - parseInt(fakeState2.indexerTip)) / indexRate,
              synced: false,
            })
          })
        });
        describe('when advanced indexer tip is less than 50', () => {
          const fakeState1 = {
            cacheTip,
            indexerTip: (bestKnownBlockNumber - 50).toString(),
            timestamp: '6000',
          }
          const fakeState2 = {
            cacheTip,
            indexerTip: (bestKnownBlockNumber - 1).toString(),
            timestamp: '7000',
          }
          beforeEach(async () => {
            emitter.emit('sync-states-updated', fakeState1)
            emitter.emit('sync-states-updated', fakeState2)
            await flushPromises()
          });
          it('indicates synced', () => {
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState2.timestamp),
              bestKnownBlockNumber,
              cacheTip: parseInt(fakeState2.cacheTip),
              indexerTip: parseInt(fakeState2.indexerTip),
              indexRate: undefined,
              cacheRate: undefined,
              estimate: undefined,
              synced: false,
            })
          })
        });
        describe('with samples spaning over 1 min', () => {
          const fakeState1 = {
            cacheTip,
            indexerTip: '100',
            timestamp: '1000',
          }
          const fakeState2 = {
            cacheTip,
            indexerTip: '200',
            timestamp: '6000',
          }
          const fakeState3 = {
            cacheTip,
            indexerTip: '6200',
            timestamp: '66000',
          }
          beforeEach(async () => {
            emitter.emit('sync-states-updated', fakeState1)
            emitter.emit('sync-states-updated', fakeState2)
            emitter.emit('sync-states-updated', fakeState3)
            await flushPromises()
          });
          it('estimates with samples in the last minute', () => {
            const indexRate = (
              parseInt(fakeState3.indexerTip) - parseInt(fakeState2.indexerTip)
            ) / (parseInt(fakeState3.timestamp) - parseInt(fakeState2.timestamp))
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState3.timestamp),
              bestKnownBlockNumber,
              indexRate,
              cacheRate: undefined,
              cacheTip: parseInt(fakeState3.cacheTip),
              indexerTip: parseInt(fakeState3.indexerTip),
              estimate: (bestKnownBlockNumber - parseInt(fakeState3.indexerTip)) / indexRate,
              synced: false,
            })
          })
          describe('when switching network', () => {
            beforeEach(async () => {
              stubbedNodeGetInstance.mockImplementation(() => ({
                ckb: {
                  node: {
                    url: 'http://diffurl'
                  }
                }
              }))
              emitter.emit('sync-states-updated', fakeState3)
              await flushPromises()
            });
            it('resets samples', () => {
              expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
                nodeUrl: 'http://diffurl',
                timestamp: parseInt(fakeState3.timestamp),
                bestKnownBlockNumber,
                indexRate: undefined,
                cacheRate: undefined,
                cacheTip: parseInt(fakeState3.cacheTip),
                indexerTip: parseInt(fakeState3.indexerTip),
                estimate: undefined,
                synced: false,
              })
            })
          });
        });
      });
    });
  });
});

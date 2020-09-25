import Emitter from 'events'
import { flushPromises } from '../test-utils'

const stubbedEmitter = jest.fn()
const stubbedSyncedBlockNumber = jest.fn()
const stubbedSyncStateSubjectNext = jest.fn()
const stubbedSDKMethod = jest.fn()
const stubbedNodeGetInstance = jest.fn()
const stubbedSetNextBlock = jest.fn()

const resetMocks = () => {
  stubbedEmitter.mockReset()
  stubbedSyncedBlockNumber.mockReset()
  stubbedSyncStateSubjectNext.mockReset()
  stubbedSDKMethod.mockReset()
  stubbedNodeGetInstance.mockReset()
  stubbedSetNextBlock.mockReset()
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
    jest.doMock('models/synced-block-number', () => {
      return jest.fn().mockImplementation(() => {
        return {setNextBlock: stubbedSetNextBlock}
      })
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

  describe('on sync-estimate-updated', () => {
    const bestKnownBlockNumber = 10000
    beforeEach(() => {
      jest
        .spyOn(Date, 'now')
        .mockImplementation(() => 66000);
      stubbedSDKMethod.mockResolvedValue({best_known_block_number: bestKnownBlockNumber.toString(16)})
      stubbedNodeGetInstance.mockImplementation(() => ({
        ckb: {
          node: {
            url: fakeNodeUrl
          }
        }
      }))
    });
    describe('estimate based on rate of indexing', () => {
      describe('when completed cache', () => {
        const cacheTipNumber = (bestKnownBlockNumber - 4).toString()
        const fakeState1 = {
          cacheTipNumber,
          indexerTipNumber: (bestKnownBlockNumber - 50).toString(),
          timestamp: '6000',
        }
        const fakeState2 = {
          cacheTipNumber,
          indexerTipNumber: (bestKnownBlockNumber - 50).toString(),
          timestamp: '7000',
        }
        beforeEach(async () => {
          emitter.emit('sync-estimate-updated', fakeState1)
          emitter.emit('sync-estimate-updated', fakeState2)
          await flushPromises()
        });
        it('indicates synced', () => {
          expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
            nodeUrl: fakeNodeUrl,
            timestamp: parseInt(fakeState2.timestamp),
            bestKnownBlockNumber,
            cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
            indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
            indexRate: undefined,
            cacheRate: undefined,
            estimate: undefined,
            synced: true,
          })
        })
        it('stores next block number', () => {
          expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
        })
      });
      describe('when cache is still ongoing', () => {
        const cacheTipNumber = (bestKnownBlockNumber - 5).toString()
        describe('with only one sample', () => {
          const fakeState1 = {
            cacheTipNumber,
            indexerTipNumber: bestKnownBlockNumber.toString(),
            timestamp: '6000',
          }
          beforeEach(async () => {
            emitter.emit('sync-estimate-updated', fakeState1)
            await flushPromises()
          });
          it('should not calculate estimation', () => {
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState1.timestamp),
              bestKnownBlockNumber,
              cacheTipNumber: parseInt(fakeState1.cacheTipNumber),
              indexerTipNumber: parseInt(fakeState1.indexerTipNumber),
              indexRate: undefined,
              cacheRate: undefined,
              estimate: undefined,
              synced: false,
            })
          })
          it('stores next block number', () => {
            expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
          })
        });
        describe('when advanced indexer tip is greater or equals to 50', () => {
          const fakeState1 = {
            cacheTipNumber,
            indexerTipNumber: (bestKnownBlockNumber - 51).toString(),
            timestamp: '6000',
          }
          const fakeState2 = {
            cacheTipNumber,
            indexerTipNumber: (bestKnownBlockNumber - 1).toString(),
            timestamp: '7000',
          }
          beforeEach(async () => {
            emitter.emit('sync-estimate-updated', fakeState1)
            emitter.emit('sync-estimate-updated', fakeState2)
            await flushPromises()
          });
          it('calculates estimation', () => {
            const indexRate = 50 / (parseInt(fakeState2.timestamp) - parseInt(fakeState1.timestamp))
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState2.timestamp),
              bestKnownBlockNumber,
              cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
              indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
              indexRate,
              cacheRate: undefined,
              estimate: (bestKnownBlockNumber - parseInt(fakeState2.indexerTipNumber)) / indexRate,
              synced: false,
            })
          })
          it('stores next block number', () => {
            expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
          })
        });
        describe('when advanced indexer tip is less than 50', () => {
          const fakeState1 = {
            cacheTipNumber,
            indexerTipNumber: (bestKnownBlockNumber - 50).toString(),
            timestamp: '6000',
          }
          const fakeState2 = {
            cacheTipNumber,
            indexerTipNumber: (bestKnownBlockNumber - 1).toString(),
            timestamp: '7000',
          }
          beforeEach(async () => {
            emitter.emit('sync-estimate-updated', fakeState1)
            emitter.emit('sync-estimate-updated', fakeState2)
            await flushPromises()
          });
          it('should not calculate estimation', () => {
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState2.timestamp),
              bestKnownBlockNumber,
              cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
              indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
              indexRate: undefined,
              cacheRate: undefined,
              estimate: undefined,
              synced: false,
            })
          })
          it('stores next block number', () => {
            expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
          })
        });
        describe('with samples spaning over 1 min', () => {
          const fakeState1 = {
            cacheTipNumber,
            indexerTipNumber: '100',
            timestamp: '1000',
          }
          const fakeState2 = {
            cacheTipNumber,
            indexerTipNumber: '200',
            timestamp: '6000',
          }
          const fakeState3 = {
            cacheTipNumber,
            indexerTipNumber: '6200',
            timestamp: '66000',
          }
          beforeEach(async () => {
            emitter.emit('sync-estimate-updated', fakeState1)
            emitter.emit('sync-estimate-updated', fakeState2)
            emitter.emit('sync-estimate-updated', fakeState3)
            await flushPromises()
          });
          it('estimates with samples in the last minute', () => {
            const indexRate = (
              parseInt(fakeState3.indexerTipNumber) - parseInt(fakeState2.indexerTipNumber)
            ) / (parseInt(fakeState3.timestamp) - parseInt(fakeState2.timestamp))
            expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
              nodeUrl: fakeNodeUrl,
              timestamp: parseInt(fakeState3.timestamp),
              bestKnownBlockNumber,
              indexRate,
              cacheRate: undefined,
              cacheTipNumber: parseInt(fakeState3.cacheTipNumber),
              indexerTipNumber: parseInt(fakeState3.indexerTipNumber),
              estimate: (bestKnownBlockNumber - parseInt(fakeState3.indexerTipNumber)) / indexRate,
              synced: false,
            })
          })
          it('stores next block number', () => {
            expect(stubbedSetNextBlock).toHaveBeenCalledWith(BigInt(cacheTipNumber))
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
              emitter.emit('sync-estimate-updated', fakeState3)
              await flushPromises()
            });
            it('resets samples', () => {
              expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
                nodeUrl: 'http://diffurl',
                timestamp: parseInt(fakeState3.timestamp),
                bestKnownBlockNumber,
                indexRate: undefined,
                cacheRate: undefined,
                cacheTipNumber: parseInt(fakeState3.cacheTipNumber),
                indexerTipNumber: parseInt(fakeState3.indexerTipNumber),
                estimate: undefined,
                synced: false,
              })
            })
          });
        });
      });
      describe('when searching best known block number is in progress', () => {
        const cacheTipNumber = bestKnownBlockNumber.toString()
        const fakeState1 = {
          cacheTipNumber,
          indexerTipNumber: (bestKnownBlockNumber - 101).toString(),
          timestamp: '6000',
        }

        const nextBestKnownBlockNumber = bestKnownBlockNumber + 5
        const fakeState2 = {
          cacheTipNumber: nextBestKnownBlockNumber.toString(),
          indexerTipNumber: (bestKnownBlockNumber - 50).toString(),
          timestamp: '7000',
        }
        beforeEach(async () => {
          emitter.emit('sync-estimate-updated', fakeState1)
          stubbedSDKMethod.mockResolvedValue({best_known_block_number: nextBestKnownBlockNumber.toString(16)})
          emitter.emit('sync-estimate-updated', fakeState2)
          await flushPromises()
        });
        it('should not calculate estimation', () => {
          expect(stubbedSyncStateSubjectNext).toHaveBeenCalledWith({
            nodeUrl: fakeNodeUrl,
            timestamp: parseInt(fakeState2.timestamp),
            bestKnownBlockNumber: nextBestKnownBlockNumber,
            cacheTipNumber: parseInt(fakeState2.cacheTipNumber),
            indexerTipNumber: parseInt(fakeState2.indexerTipNumber),
            indexRate: undefined,
            cacheRate: undefined,
            estimate: undefined,
            synced: false,
          })
        })
      });
    });
  });
});

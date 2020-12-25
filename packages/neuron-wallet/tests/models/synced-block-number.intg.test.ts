import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'

const stubbedSyncedBlockNumberSubjectNext = jest.fn()
const stubbedLoggerInfo = jest.fn()

const resetMocks = () => {
  stubbedSyncedBlockNumberSubjectNext.mockReset()
  stubbedLoggerInfo.mockReset()
}

describe('SyncedBlockNumber model', () => {
  let SyncedBlockNumber: any
  beforeAll(async () => {
    await initConnection('')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    resetMocks()

    jest.doMock('models/subjects/node', () => {
      return {
        getSubject: () => ({
          next: stubbedSyncedBlockNumberSubjectNext
        })
      }
    });
    jest.doMock('utils/logger', () => {
      return {
        info: stubbedLoggerInfo
      }
    });
    SyncedBlockNumber = require('../../src/models/synced-block-number').default
  })

  describe('inits with 0 synced block number', () => {
    let syncedBlockNumber: any
    beforeEach(async () => {
      syncedBlockNumber = new SyncedBlockNumber()
      await syncedBlockNumber.setNextBlock(BigInt(0))
    })
    it('updates logs', () => {
      expect(stubbedLoggerInfo).toHaveBeenCalled()
    })
    describe('checks saved block number', () => {
      let nextBlock: bigint
      beforeEach(async () => {
        nextBlock = await syncedBlockNumber.getNextBlock()
      });
      it('returns block number 0', () => {
        expect(nextBlock).toEqual(BigInt(0))
      })
    });
    describe('#setNextBlock', () => {
      beforeEach(() => {
        resetMocks()
      });
      describe('when setting to a block number having absolute difference with the previous one by less than 10', () => {
        beforeEach(async () => {
          await syncedBlockNumber.setNextBlock(BigInt(9))
        });
        it('should not update logs', () => {
          expect(stubbedLoggerInfo).not.toHaveBeenCalled()
        })
        describe('checks saved block number', () => {
          let nextBlock: bigint
          beforeEach(async () => {
            nextBlock = await syncedBlockNumber.getNextBlock()
          });
          it('returns previous block number', () => {
            expect(nextBlock).toEqual(BigInt(0))
          })
        });
      });
      describe('when setting to a block number having absolute difference with the previous one by greater or equals to 10', () => {
        beforeEach(async () => {
          await syncedBlockNumber.setNextBlock(BigInt(10))
        });
        it('updates logs', () => {
          expect(stubbedLoggerInfo).toHaveBeenCalled()
        })
        describe('checks saved block number', () => {
          let nextBlock: bigint
          beforeEach(async () => {
            nextBlock = await syncedBlockNumber.getNextBlock()
          });
          it('returns current block number', () => {
            expect(nextBlock).toEqual(BigInt(10))
          })
        });
      });
    });
  });

})

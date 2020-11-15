
const stubbedSyncControllerConstructor = jest.fn()
const stubbedRpcServiceConstructor = jest.fn()
const stubbedCurrentBlockNumber = jest.fn()
const stubbedGetLatestConnectionStatus = jest.fn()
const stubbedGetTipHeader = jest.fn()
const stubbedDateNow = jest.fn()

const resetMocks = () => {
  stubbedCurrentBlockNumber.mockReset()
  stubbedGetLatestConnectionStatus.mockReset()
  stubbedGetTipHeader.mockReset()
  stubbedDateNow.mockReset()
}

describe('AssetAccountController', () => {
  let syncApiController: any;

  jest.doMock('../../src/models/subjects/node', () => {
    return {
      getLatestConnectionStatus: stubbedGetLatestConnectionStatus
    }
  });
  jest.doMock('../../src/services/rpc-service', () => {
    return {
      __esModule: true,
      default: stubbedRpcServiceConstructor.mockImplementation(
        () => ({
          getTipHeader: stubbedGetTipHeader,
        })
      ),
    }
  });

  jest.doMock('../../src/controllers/sync', () => ({
    __esModule: true,
    default: stubbedSyncControllerConstructor.mockImplementation(
      () => ({
        currentBlockNumber: stubbedCurrentBlockNumber,
      })
    ),
  }));


  beforeEach(() => {
    resetMocks()
    const SyncApiController = require('../../src/controllers/sync-api').default
    syncApiController = new SyncApiController()
    Date.now = stubbedDateNow
  });
  describe('#getSyncStatus', () => {
    let syncStatus: AnalyserOptions
    const mockStates = (syncedBlockNumber: any, url: any, tipHeader: any) => {
      stubbedCurrentBlockNumber.mockResolvedValue({status: true, result: {currentBlockNumber: syncedBlockNumber}})
      stubbedGetLatestConnectionStatus.mockResolvedValue({url})
      stubbedGetTipHeader.mockResolvedValue(tipHeader)
    }
    beforeEach(() => {
      stubbedDateNow.mockReturnValue('10000000')
    });
    [
      ['2', 'fakeurl1', {number: '12', timestamp: '10000000'}, 3],
      ['1', 'fakeurl1', {number: '12', timestamp: '10000000'}, 2],
      ['1', 'fakeurl1', {number: '0', timestamp: '10000000'}, 0],
    ].forEach(([syncedBlockNumber, url, tipHeader, expectedSyncStatus]) => {
      const {number, timestamp} = tipHeader as any
      describe(`when syncedBlockNumber: ${syncedBlockNumber}, url: ${url}, tipBlockNumber: ${number}, tipTimestamp: ${timestamp}, syncStatus: ${expectedSyncStatus}`, () => {
        beforeEach(async () => {
          mockStates(syncedBlockNumber, url, tipHeader)
          syncStatus = await syncApiController.getSyncStatus()
        });
        it(`returns expected sync status ${expectedSyncStatus}`, () => {
          expect(syncStatus).toEqual(expectedSyncStatus)
        })
      });
    })

    describe('SyncPending status', () => {
      describe("with the first check", () => {
        beforeEach(async () => {
          mockStates('2', 'fakeurl1', {number: '12', timestamp: '10000000'})
          await syncApiController.getSyncStatus()
        });
        describe('with the second check 10 min later', () => {
          beforeEach(async () => {
            stubbedDateNow.mockReturnValue('16000000')
            mockStates('2', 'fakeurl1', {number: '12', timestamp: '10000000'})
            syncStatus = await syncApiController.getSyncStatus()
          });
          it(`returns expected sync pending status`, () => {
            expect(syncStatus).toEqual(1)
          })
        });
      })
    });
  });
});

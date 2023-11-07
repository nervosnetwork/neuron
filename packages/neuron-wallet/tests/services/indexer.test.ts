import IndexerService from '../../src/services/indexer'

const existsSyncMock = jest.fn()
const rmSyncMock = jest.fn()
const stopMonitorMock = jest.fn()
const getCurrentWalletMock = jest.fn()

jest.mock('fs', () => {
  return {
    existsSync: () => existsSyncMock(),
    readFileSync: () => jest.fn(),
    writeFileSync: () => jest.fn(),
    rmSync: () => rmSyncMock(),
  }
})

const setIndexerDataPathMock = jest.fn()
const getIndexerDataPathMock = jest.fn()
jest.mock('../../src/services/settings', () => {
  return class {
    static getInstance() {
      return {
        get indexerDataPath() {
          return getIndexerDataPathMock()
        },
        set indexerDataPath(value: string) {
          setIndexerDataPathMock(value)
        },
        getNodeDataPath: jest.fn().mockReturnValue(''),
      }
    }
  }
})

jest.mock('../../src/utils/logger', () => ({
  debug: () => jest.fn(),
}))

jest.mock('../../src/models/synced-block-number', () => {
  return function () {
    return {
      setNextBlock: jest.fn(),
    }
  }
})

jest.mock('../../src/database/chain', () => ({
  clean: () => jest.fn(),
}))

jest.mock('../../src/services/monitor', () => {
  function mockMonitor() {}
  mockMonitor.stopMonitor = () => stopMonitorMock()
  return mockMonitor
})

jest.mock('../../src/services/networks', () => ({
  getInstance() {
    return {
      getCurrent: getCurrentWalletMock,
    }
  },
}))

const resetSyncTaskQueueAsyncPushMock = jest.fn()
jest.mock('../../src/block-sync-renderer', () => ({
  resetSyncTaskQueue: {
    asyncPush: () => resetSyncTaskQueueAsyncPushMock(),
  },
}))

describe('test IndexerService', () => {
  beforeEach(() => {
    existsSyncMock.mockReset()
    rmSyncMock.mockReset()
    setIndexerDataPathMock.mockReset()
    getIndexerDataPathMock.mockReset()
    getCurrentWalletMock.mockReset()
    stopMonitorMock.mockReset()
  })
  describe('test remove old indexer data', () => {
    it('old indexer data path exist', () => {
      existsSyncMock.mockReturnValueOnce(true)
      getIndexerDataPathMock.mockReturnValueOnce('indexer-path')
      IndexerService.cleanOldIndexerData()
      expect(rmSyncMock).toBeCalled()
      expect(setIndexerDataPathMock).toBeCalledWith('')
    })
    it('old indexer data not exist', () => {
      existsSyncMock.mockReturnValueOnce(false)
      IndexerService.cleanOldIndexerData()
      expect(rmSyncMock).toBeCalledTimes(0)
    })
    it('old indexer data is empty', () => {
      getIndexerDataPathMock.mockReturnValueOnce('')
      existsSyncMock.mockReturnValueOnce(true)
      IndexerService.cleanOldIndexerData()
      expect(rmSyncMock).toBeCalledTimes(0)
    })
  })

  describe('test clear cache', () => {
    beforeEach(() => {
      resetSyncTaskQueueAsyncPushMock.mockReset()
    })
    it('is external ckb node', async () => {
      getCurrentWalletMock.mockReturnValue({ readonly: false })
      await IndexerService.clearCache()
      expect(stopMonitorMock).toBeCalledTimes(0)
      expect(resetSyncTaskQueueAsyncPushMock).toBeCalledTimes(1)
    })
    it('is internal ckb node', async () => {
      getCurrentWalletMock.mockReturnValue({ readonly: true })
      await IndexerService.clearCache()
      expect(stopMonitorMock).toBeCalledTimes(0)
      expect(resetSyncTaskQueueAsyncPushMock).toBeCalledTimes(1)
    })
    it('clear indexer data with internal ckb node', async () => {
      getCurrentWalletMock.mockReturnValue({ readonly: true })
      await IndexerService.clearCache(true)
      expect(stopMonitorMock).toBeCalledTimes(1)
      expect(resetSyncTaskQueueAsyncPushMock).toBeCalledTimes(1)
    })
    it('clear indexer data with external ckb node', async () => {
      getCurrentWalletMock.mockReturnValue({ readonly: false })
      await IndexerService.clearCache(true)
      expect(stopMonitorMock).toBeCalledTimes(0)
      expect(resetSyncTaskQueueAsyncPushMock).toBeCalledTimes(1)
    })
  })
})

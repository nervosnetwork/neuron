import IndexerService from '../../src/services/indexer'

const existsSyncMock = jest.fn()
const rmSyncMock = jest.fn()

jest.mock('fs', () => {
  return {
    existsSync: () => existsSyncMock(),
    readFileSync: () => jest.fn(),
    writeFileSync: () => jest.fn(),
    rmSync: () => rmSyncMock()
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
        }
      }
    }
  }
})

jest.mock('../../src/utils/logger', () => ({
  debug: () => jest.fn()
}))

jest.mock('../../src/models/synced-block-number', () => ({
  
}))

jest.mock('../../src/database/chain', () => ({
  
}))

jest.mock('../../src/services/monitor', () => ({
  
}))

describe('test IndexerService', () => {
  beforeEach(() => {
    existsSyncMock.mockReset()
    rmSyncMock.mockReset()
    setIndexerDataPathMock.mockReset()
    getIndexerDataPathMock.mockReset()
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
})

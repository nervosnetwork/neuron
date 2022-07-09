import SettingsService from '../../src/services/settings'

const readSyncMock = jest.fn()
const writeSyncMock = jest.fn()
const resolveMock = jest.fn()
const getLocaleMock = jest.fn()
const getPathMock = jest.fn()
const updateApplicationMenuMock = jest.fn()

function resetMock() {
  readSyncMock.mockReset()
  writeSyncMock.mockReset()
  resolveMock.mockReset()
  getLocaleMock.mockReset()
  getPathMock.mockReset()
  updateApplicationMenuMock.mockReset()
}

jest.mock('../../src/models/store', () => {
  function MockStore() {}
  MockStore.prototype.readSync = (field: string) => readSyncMock(field)
  MockStore.prototype.writeSync = (field: string, value: any) => writeSyncMock(field, value)
  return MockStore
})

jest.mock('../../src/controllers/app/menu', () => ({
  updateApplicationMenu: () => updateApplicationMenuMock()
}))

jest.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: jest.fn().mockReturnValue([])
  }
}))

jest.mock('path', () => ({
  resolve: () => resolveMock()
}))

jest.mock('env', () => ({
  app: {
    getLocale: () => getLocaleMock(),
    getPath: () => getPathMock()
  }
}))

describe('SettingsService', () => {
  beforeEach(() => {
    resetMock()
  })

  it('constructor no ckbDataPath', () => {
    const instance = SettingsService.getInstance()
    readSyncMock.mockReturnValue('ckbDataPath')
    expect(instance.ckbDataPath).toEqual('ckbDataPath')
  })

  describe('locale', () => {
    it('get', () => {
      SettingsService.getInstance().locale
      expect(readSyncMock).toBeCalledWith('locale')
    })
    it('set', () => {
      SettingsService.getInstance().locale = 'zh'
      expect(writeSyncMock).toBeCalledWith('locale', 'zh')
      expect(updateApplicationMenuMock).toHaveBeenCalled()
    })
    it('set exception', () => {
      expect(() => SettingsService.getInstance().locale = 'zh11' as any).toThrow(new Error(`Locale zh11 not supported`))
    })
  })
  

  describe('indexer-path', () => {
    it('get', () => {
      SettingsService.getInstance().indexerDataPath
      expect(readSyncMock).toBeCalledWith('indexerDataPath')
    })
    it('set', () => {
      SettingsService.getInstance().indexerDataPath = 'indexerDataPath'
      expect(writeSyncMock).toBeCalledWith('indexerDataPath', 'indexerDataPath')
    })
  })

  describe('ckb-node-path', () => {
    it('get', () => {
      SettingsService.getInstance().ckbDataPath
      expect(readSyncMock).toBeCalledWith('ckbDataPath')
    })
    it('set', () => {
      SettingsService.getInstance().ckbDataPath = 'ckbDataPath'
      expect(writeSyncMock).toBeCalledWith('ckbDataPath', 'ckbDataPath')
    })
  })
})

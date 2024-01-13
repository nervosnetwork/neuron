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
  updateApplicationMenu: () => updateApplicationMenuMock(),
}))

jest.mock('../../src/services/networks', () => {
  return {
    getInstance() {
      return {
        getCurrent: jest.fn().mockReturnValue({ chain: 'ckb_testnet' }),
      }
    },
  }
})

jest.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: jest.fn().mockReturnValue([]),
  },
}))

jest.mock('path', () => ({
  resolve: () => resolveMock(),
}))

jest.mock('env', () => ({
  app: {
    getLocale: () => getLocaleMock(),
    getPath: () => getPathMock(),
  },
}))

describe('SettingsService', () => {
  beforeEach(() => {
    resetMock()
  })

  it('constructor no ckbDataPath', () => {
    const instance = SettingsService.getInstance()
    readSyncMock.mockReturnValue('ckbDataPath')
    expect(instance.getNodeDataPath('ckb')).toEqual('ckbDataPath')
  })

  describe('locale', () => {
    it('get', () => {
      SettingsService.getInstance().locale
      expect(readSyncMock).toBeCalledWith('locale')
    })
    it('set', () => {
      SettingsService.getInstance().locale = 'zh'
      SettingsService.getInstance().locale = 'fr'
      expect(writeSyncMock).toBeCalledWith('locale', 'zh')
      expect(writeSyncMock).toBeCalledWith('locale', 'fr')
      expect(updateApplicationMenuMock).toHaveBeenCalled()
    })
    it('set exception', () => {
      expect(() => (SettingsService.getInstance().locale = 'zh11' as any)).toThrow(
        new Error(`Locale zh11 not supported`)
      )
    })
  })

  describe('ckb-node-path', () => {
    it('get with chain', () => {
      SettingsService.getInstance().getNodeDataPath('ckb')
      expect(readSyncMock).toBeCalledWith('nodeDataPath_ckb')
    })
    it('get without chain', () => {
      SettingsService.getInstance().getNodeDataPath()
      expect(readSyncMock).toBeCalledWith('nodeDataPath_ckb_testnet')
    })
    it('set with chain', () => {
      SettingsService.getInstance().setNodeDataPath('ckbDataPath', 'ckb')
      expect(writeSyncMock).toBeCalledWith('nodeDataPath_ckb', 'ckbDataPath')
    })
    it('set without chain', () => {
      SettingsService.getInstance().setNodeDataPath('ckbDataPath')
      expect(writeSyncMock).toBeCalledWith('nodeDataPath_ckb_testnet', 'ckbDataPath')
    })
  })
})

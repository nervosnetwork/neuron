jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn(),
    showMessageBox: jest.fn(),
    showErrorBox: jest.fn(),
  },

  app: {
    getVersion: jest.fn().mockReturnValue('mock_version'),
    getPath: jest.fn().mockReturnValue('mock_path'),
    getName: jest.fn().mockReturnValue('mock_name'),
  },
}))

jest.mock('../../src/services/addresses', () => {
  return {
    getAddressesByAllWallets: () => [
      {
        walletId: '0',
        addressType: '0',
        addressIndex: '0',
        blake160: 'hash1',
      },
      {
        walletId: '1',
        addressType: '1',
        addressIndex: '1',
        blake160: 'hash2',
      },
    ],
  }
})

jest.mock('fs', () => {
  return {
    createWriteStream: () => null,
    readFileSync: () => JSON.stringify({}),
    writeFileSync: () => jest.fn(),
    existsSync: () => jest.fn()(),
  }
})

jest.mock('../../src/utils/logger', () => ({
  error: console.error,
  transports: {
    file: {
      getFile: jest.fn(),
    },
  },
}))

jest.mock('../../src/services/networks', () => {
  return {
    getInstance() {
      return {
        getCurrent() {
          return {
            remote: 'http://127.0.0.1:8114',
            type: NetworkType.Normal,
          }
        },
      }
    },
  }
})

jest.mock('../../src/services/settings', () => {
  return {
    getInstance() {
      return {
        ckbDataPath: '',
      }
    },
  }
})

jest.mock('../../src/services/light-runner', () => {
  return {
    CKBLightRunner: {
      getInstance() {
        return {
          getLogPath() {
            return ''
          },
        }
      },
    },
  }
})

jest.mock('../../src/services/wallets', () => {
  return {
    getInstance() {
      return {
        getAll() {
          return []
        },
      }
    },
  }
})

const encryptionMock = {
  isEnabled: false,
  encrypt: jest.fn(v => v),
}

jest.mock('../../src/services/log-encryption.ts', () => {
  return {
    getInstance() {
      return encryptionMock
    },
  }
})

import { dialog } from 'electron'
import logger from '../../src/utils/logger'
import ExportDebugController from '../../src/controllers/export-debug'
import { NetworkType } from '../../src/models/network'

describe('Test ExportDebugController', () => {
  const exportDebugController: any = new ExportDebugController()

  // electron methods
  let showSaveDialogMock: any
  let showMessageBoxMock: any
  let showErrorBoxMock: any
  // controller methods
  let addBundledCKBLogMock: any
  let addBundledCKBLightClientLogMock: any
  let addLogFilesMock: any
  let addStatusFileMock: any
  let archiveAppendMock: any

  beforeAll(() => {
    showSaveDialogMock = jest.spyOn(dialog, 'showSaveDialog')
    showMessageBoxMock = jest.spyOn(dialog, 'showMessageBox')
    showErrorBoxMock = jest.spyOn(dialog, 'showErrorBox')
    addBundledCKBLogMock = jest.spyOn(exportDebugController, 'addBundledCKBLog')
    addBundledCKBLightClientLogMock = jest.spyOn(exportDebugController, 'addBundledCKBLightClientLog')
    addLogFilesMock = jest.spyOn(exportDebugController, 'addLogFiles')
    addStatusFileMock = jest.spyOn(exportDebugController, 'addStatusFile')
    archiveAppendMock = jest.spyOn(exportDebugController.archive, 'append')
    jest.spyOn(exportDebugController.archive, 'file').mockReturnValue(undefined)
    jest.spyOn(exportDebugController.archive, 'pipe').mockImplementation(() => {})
    jest.spyOn(logger, 'error')
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when logs are exported successfully', () => {
    beforeEach(() => {
      showSaveDialogMock.mockResolvedValue({ canceled: false, filePath: 'mock_path' })
      return exportDebugController.export()
    })

    it('should call required methods', () => {
      expect.assertions(10)
      expect(showSaveDialogMock).toHaveBeenCalled()

      expect(addBundledCKBLogMock).toHaveBeenCalled()
      expect(addBundledCKBLightClientLogMock).toHaveBeenCalled()
      expect(addLogFilesMock).toHaveBeenCalled()
      expect(addStatusFileMock).toHaveBeenCalled()

      expect(showMessageBoxMock).toHaveBeenCalled()
      expect(showErrorBoxMock).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
      expect(encryptionMock.encrypt).not.toHaveBeenCalled()

      const csv = ['index,addressType,addressIndex,publicKeyInBlake160\n', '0,0,0,hash1\n', '1,1,1,hash2\n'].join('')
      expect(archiveAppendMock).toHaveBeenCalledWith(csv, expect.objectContaining({ name: 'hd_public_key_info.csv' }))
    })
  })

  describe('when exporting is canceled', () => {
    beforeEach(() => {
      showSaveDialogMock.mockResolvedValue({ cancel: true, filePath: '' })
      return exportDebugController.export()
    })

    it('should not call required methods', () => {
      expect.assertions(9)

      expect(showSaveDialogMock).toHaveBeenCalled()

      expect(addBundledCKBLogMock).not.toHaveBeenCalled()
      expect(addBundledCKBLightClientLogMock).not.toHaveBeenCalled()
      expect(addLogFilesMock).not.toHaveBeenCalled()
      expect(addStatusFileMock).not.toHaveBeenCalled()
      expect(archiveAppendMock).not.toHaveBeenCalled()

      expect(showMessageBoxMock).not.toHaveBeenCalled()
      expect(showErrorBoxMock).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })
  })

  describe('when error occurs', () => {
    beforeEach(() => {
      showSaveDialogMock.mockRejectedValue('mock rejected')
      return exportDebugController.export()
    })

    it('should call error box method', () => {
      expect.assertions(2)
      expect(showMessageBoxMock).not.toHaveBeenCalled()
      expect(showErrorBoxMock).toHaveBeenCalled()
    })
  })

  describe('when encryption is enabled', () => {
    beforeEach(() => {
      encryptionMock.isEnabled = true
      showSaveDialogMock.mockResolvedValue({ canceled: false, filePath: 'mock_path' })
      return exportDebugController.export()
    })

    it('encrypt should be called', () => {
      expect.assertions(1)
      expect(encryptionMock.encrypt).toHaveBeenCalled()
    })
  })
})


jest.mock('../../src/services/networks', () => {
  return {
    getInstance() {
      return {
        getCurrent() {
          return {
            remote: 'http://localhost:8114'
          }
        }
      }
    }
  }
})

jest.mock('fs', () => {
  return {
    createWriteStream: () => null
  }
})

import { dialog } from 'electron'
import logger from '../../src/utils/logger'
import ExportDebugController from '../../src/controllers/export-debug'

describe('Test ExportDebugController', () => {
  const exportDebugController: any = new ExportDebugController()

  // electron methods
  let showSaveDialogMock: any
  let showMessageBoxMock: any
  let showErrorBoxMock: any
  // controller methods
  let addBundledCKBLogMock: any
  let addLogFilesMock: any
  let addStatusFileMock: any

  beforeAll(() => {
    showSaveDialogMock = jest.spyOn(dialog, 'showSaveDialog')
    showMessageBoxMock = jest.spyOn(dialog, 'showMessageBox')
    showErrorBoxMock = jest.spyOn(dialog, 'showErrorBox')
    addBundledCKBLogMock = jest.spyOn(exportDebugController, 'addBundledCKBLog')
    addLogFilesMock = jest.spyOn(exportDebugController, 'addLogFiles')
    addStatusFileMock = jest.spyOn(exportDebugController, 'addStatusFile')
    jest.spyOn(exportDebugController.archive, 'append')
    jest.spyOn(exportDebugController.archive, 'file')
    jest.spyOn(exportDebugController.archive, 'pipe').mockImplementation(() => { })
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
      expect.assertions(7)
      expect(showSaveDialogMock).toHaveBeenCalled()

      expect(addBundledCKBLogMock).toHaveBeenCalled()
      expect(addLogFilesMock).toHaveBeenCalled()
      expect(addStatusFileMock).toHaveBeenCalled()

      expect(showMessageBoxMock).toHaveBeenCalled()
      expect(showErrorBoxMock).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })
  })

  describe('when exporting is canceled', () => {
    beforeEach(() => {
      showSaveDialogMock.mockResolvedValue({ cancel: true, filePath: '' })
      return exportDebugController.export()
    })

    it('should not call required methods', () => {
      expect.assertions(7)

      expect(showSaveDialogMock).toHaveBeenCalled()

      expect(addBundledCKBLogMock).not.toHaveBeenCalled()
      expect(addLogFilesMock).not.toHaveBeenCalled()
      expect(addStatusFileMock).not.toHaveBeenCalled()

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
})

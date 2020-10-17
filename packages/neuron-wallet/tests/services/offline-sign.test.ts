const stubbedElectronShowOpenDialog = jest.fn()
const stubbedElectronShowErrorBox = jest.fn()
const stubbedReadfileSync = jest.fn()

function resetMocks () {
  stubbedElectronShowErrorBox.mockReset()
  stubbedElectronShowOpenDialog.mockReset()
  stubbedReadfileSync.mockReset()
}

describe('OfflineSignService', () => {
  let OfflineSignService: any

  beforeEach(async () => {
    resetMocks()

    jest.doMock('electron', () => {
      return {
        dialog: {
          showOpenDialog: stubbedElectronShowOpenDialog,
          showErrorBox: stubbedElectronShowErrorBox
        }
      }
    })

    jest.doMock('fs', () => {
      return {
        readFileSync: stubbedReadfileSync
      }
    })

    OfflineSignService = require('../../src/services/offline-sign').default
  })

  describe('loadTransactionJSON', () => {

    describe('early return', () => {
      beforeEach(() => {
        resetMocks()
      })

      it('early return if user cancel', async () => {
        stubbedElectronShowOpenDialog.mockReturnValueOnce({
          canceled: true
        })
        const result = await OfflineSignService.loadTransactionJSON()
        expect(stubbedElectronShowOpenDialog).toHaveBeenCalled()
        expect(stubbedReadfileSync).not.toHaveBeenCalled()
        expect(result).toBe(undefined)
      })

      it('early return if filePath is void', async () => {
        stubbedElectronShowOpenDialog.mockReturnValueOnce({
          canceled: false
        })
        const result = await OfflineSignService.loadTransactionJSON()
        expect(stubbedElectronShowOpenDialog).toHaveBeenCalled()
        expect(stubbedReadfileSync).not.toHaveBeenCalled()
        expect(result).toBe(undefined)
      })
    })
  })

  describe('invalid JSON', () => {
    const filePath = 'filePath.json'

    beforeEach(() => {
      resetMocks()

      stubbedElectronShowOpenDialog.mockReturnValue({
        canceled: false,
        filePaths: [filePath]
      })
    })

    it('JSON do not contain transaction', async () => {
      stubbedReadfileSync.mockReturnValueOnce(`{}`)

      const result = await OfflineSignService.loadTransactionJSON()
      expect(stubbedReadfileSync).toHaveBeenCalled()
      expect(stubbedElectronShowErrorBox).toHaveBeenCalledTimes(1)
      expect(result).toBe(undefined)
    })

    it('JSON is not parsable', async () => {
      stubbedReadfileSync.mockReturnValueOnce({})
      const result = await OfflineSignService.loadTransactionJSON()
      expect(stubbedReadfileSync).toHaveBeenCalled()
      expect(stubbedElectronShowErrorBox).toHaveBeenCalledTimes(1)
      expect(result).toBe(undefined)
    })
  })

  describe('return correct value', () => {
    const filePath = 'filePath.json'

    beforeEach(() => {
      resetMocks()

      stubbedElectronShowOpenDialog.mockReturnValueOnce({
        canceled: false,
        filePaths: [filePath]
      })
      stubbedReadfileSync.mockReturnValueOnce(`{ "transaction": {} }`)
    })

    it('return json', async () => {
      const result = await OfflineSignService.loadTransactionJSON()
      expect(stubbedReadfileSync).toHaveBeenCalled()
      expect(stubbedElectronShowErrorBox).not.toHaveBeenCalled()
      expect(result.json).toEqual({ transaction: {} })
    })

    it('return filePath', async () => {
      const result = await OfflineSignService.loadTransactionJSON()
      expect(stubbedReadfileSync).toHaveBeenCalled()
      expect(stubbedElectronShowErrorBox).not.toHaveBeenCalled()
      expect(result.filePath).toBe(filePath)
    })
  })
})

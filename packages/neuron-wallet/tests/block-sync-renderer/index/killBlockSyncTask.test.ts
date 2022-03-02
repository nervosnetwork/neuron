
describe(`Kill block sync task`, () => {
  const stubbedQueryIndexer = jest.fn()
  const stubbedLoggerInfo = jest.fn()
  const stubbedLoggerDebug = jest.fn()
  const stubbedLoggerError = jest.fn()
  const stubbedChildProcessOn = jest.fn()
  const stubbedChildProcessSend = jest.fn().mockImplementation(() => { throw new Error() })
  const stubbedChildProcessOnce = jest.fn()
  const stubbedGetCurrentNetwork = jest.fn().mockReturnValue({ id: 'id', genesisHash: '0x' })
  const stubbedSyncTaskCtor = jest.fn().mockImplementation(() => ({ queryIndexer: stubbedQueryIndexer }))

  // jest.doMock('electron', () => ({ BrowserWindow: jest.fn() }))
  jest.doMock('child_process', () => ({
    spawn: jest.fn(),
    fork: jest.fn().mockImplementation(() => ({
      on: stubbedChildProcessOn,
      kill: jest.fn(),
      once: stubbedChildProcessOnce,
      send: stubbedChildProcessSend,
      stderr: {
        setEncoding: jest.fn().mockImplementation(() => ({
          on: jest.fn()
        }))
      }
    }))
  }))
  jest.doMock('services/indexer', () => ({ getInstance: () => ({ start: jest.fn(), stop: jest.fn() }) }))
  jest.doMock('services/addresses', () => ({
    updateTxCountAndBalances: jest.fn(),
    updateUsedByAnyoneCanPayByBlake160s: jest.fn(),
    getAddressesByAllWallets: () => [{}]
  }))
  jest.doMock('services/networks', () => ({ getInstance: () => ({ getCurrent: stubbedGetCurrentNetwork }) }))
  jest.doMock('block-sync-renderer/task', () => stubbedSyncTaskCtor)
  jest.doMock('utils/logger', () => ({ info: stubbedLoggerInfo, debug: stubbedLoggerDebug, error: stubbedLoggerError }))
  jest.doMock('models/subjects/data-update', () => ({ next: jest.fn() }))


  const blockSyncRenderer = require('block-sync-renderer')
  const spyRegisterRequest = jest.spyOn(blockSyncRenderer, 'registerRequest').mockResolvedValue(0)

  describe(`Kill block sync task without previous task`, () => {
    beforeAll(() => {
      return blockSyncRenderer.killBlockSyncTask()
    })

    afterAll(() => {
      stubbedLoggerInfo.mockClear()
    })

    it(`should do nothing`, () => {
      expect(stubbedLoggerInfo).not.toHaveBeenCalled()
    })

  })

  describe(`Kill block sync task with previous task`, () => {
    beforeAll(() => {
      return blockSyncRenderer.createBlockSyncTask().then(() => {
        stubbedLoggerInfo.mockClear()
        return blockSyncRenderer.killBlockSyncTask()
      })
    })

    afterAll(() => {
      stubbedLoggerInfo.mockClear()
      stubbedChildProcessOn.mockClear()
      spyRegisterRequest.mockClear()
    })

    it(`should drain pending requests`, () => {
      expect(stubbedLoggerInfo).toHaveBeenCalledWith("Sync:\tdrain requests")
    })

    it(`should wait for child to close`, () => {
      expect(stubbedChildProcessOnce).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it(`should send message to child process with unmount signal`, () => {
      expect(stubbedChildProcessSend).toHaveBeenCalledWith({ type: 'call', id: 0, channel: 'unmount', message: null }, expect.any(Function))
    })

  })

})

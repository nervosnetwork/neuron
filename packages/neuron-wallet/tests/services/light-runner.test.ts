import EventEmitter from 'events'
import path from 'path'

const lightRunnerDirpath = path.join(__dirname, '../../src/services')
const mockFn = jest.fn()
const getAppPathMock = jest.fn()
const isPackagedMock = jest.fn()
const platformMock = jest.fn()
const joinMock = jest.fn()
const dirnameMock = jest.fn()
const resolveMock = jest.fn()
const resetSyncTaskQueueMock = jest.fn()
const lightDataPathMock = jest.fn()
const existsSyncMock = jest.fn()
const readFileSyncMock = jest.fn()
const mkdirSyncMock = jest.fn()
const writeFileSyncMock = jest.fn()
const spawnMock = jest.fn()
const loggerErrorMock = jest.fn()
const loggerInfoMock = jest.fn()

function resetMock() {
  mockFn.mockReset()
  getAppPathMock.mockReset()
  isPackagedMock.mockReset()
  platformMock.mockReset()
  joinMock.mockReset()
  dirnameMock.mockReset()
  resolveMock.mockReset()
  resetSyncTaskQueueMock.mockReset()
  lightDataPathMock.mockReset()
  existsSyncMock.mockReset()
  readFileSyncMock.mockReset()
  mkdirSyncMock.mockReset()
  writeFileSyncMock.mockReset()
  spawnMock.mockReset()
  loggerErrorMock.mockReset()
  loggerInfoMock.mockReset()
}

jest.doMock('../../src/env', () => ({
  app: {
    getAppPath: getAppPathMock,
    get isPackaged() {
      return isPackagedMock()
    },
  }
}))

jest.doMock('../../src/utils/logger', () => ({
  info: loggerInfoMock,
  error: loggerErrorMock,
}))

jest.doMock('../../src/block-sync-renderer', () => ({
  resetSyncTaskQueue: {
    push: resetSyncTaskQueueMock
  }
}))

jest.doMock('../../src/services/settings', () => ({
  getInstance() {
    return {
      get lightDataPath() { return lightDataPathMock() }
    }
  }
}))

jest.doMock('process', () => ({
  get platform() {
    return platformMock()
  },
}))

jest.doMock('path', () => ({
  join: joinMock,
  dirname: dirnameMock,
  resolve: resolveMock,
}))

jest.doMock('fs', () => ({
  existsSync: existsSyncMock,
  readFileSync: readFileSyncMock,
  mkdirSync: mkdirSyncMock,
  writeFileSync: writeFileSyncMock,
}))

jest.doMock('child_process', () => ({
  spawn: spawnMock,
}))

const { CKBLightRunner } = require('../../src/services/light-runner')

describe('test light runner', () => {
  afterEach(() => {
    resetMock()
  })

  describe('test getInstance', () => {
    it('get from getInstance is same', () => {
      expect(CKBLightRunner.getInstance()).toBe(CKBLightRunner.getInstance())
    })
  })

  describe('test ckbBinary', () => {
    it('is packaged and is win', () => {
      const tmp = CKBLightRunner.getInstance().platform
      CKBLightRunner.getInstance().platform = mockFn
      isPackagedMock.mockReturnValue(true)
      getAppPathMock.mockReturnValue('apppath')
      resolveMock.mockReturnValue('prefixpath')
      joinMock.mockReturnValue('joinpath')
      mockFn.mockReturnValue('win')
      dirnameMock.mockReturnValue('dir')
      expect(CKBLightRunner.getInstance().ckbBinary).toBe('prefixpath.exe')
      expect(dirnameMock).toBeCalledWith('apppath')
      expect(joinMock).toBeCalledWith('dir', '..', './bin')
      expect(resolveMock).toBeCalledWith('joinpath', './ckb-light-client')
      CKBLightRunner.getInstance().platform = tmp
    })
    it('is packaged and is mac', () => {
      const tmp = CKBLightRunner.getInstance().platform
      CKBLightRunner.getInstance().platform = mockFn
      isPackagedMock.mockReturnValue(true)
      resolveMock.mockReturnValue('prefixpath')
      mockFn.mockReturnValue('mac')
      expect(CKBLightRunner.getInstance().ckbBinary).toBe('prefixpath')
      CKBLightRunner.getInstance().platform = tmp
    })
    it('is packaged and is linux', () => {
      const tmp = CKBLightRunner.getInstance().platform
      CKBLightRunner.getInstance().platform = mockFn
      isPackagedMock.mockReturnValue(true)
      resolveMock.mockReturnValue('prefixpath')
      mockFn.mockReturnValue('linux')
      expect(CKBLightRunner.getInstance().ckbBinary).toBe('prefixpath')
      CKBLightRunner.getInstance().platform = tmp
    })
    it('is not packaged', () => {
      const tmp = CKBLightRunner.getInstance().platform
      CKBLightRunner.getInstance().platform = mockFn
      isPackagedMock.mockReturnValue(false)
      resolveMock.mockReturnValue('prefixpath')
      joinMock.mockReturnValue('joinpath')
      mockFn.mockReturnValue('mac')
      expect(CKBLightRunner.getInstance().ckbBinary).toBe('prefixpath')
      expect(dirnameMock).toBeCalledTimes(0)
      expect(getAppPathMock).toBeCalledTimes(0)
      expect(joinMock).toBeCalledWith(lightRunnerDirpath, '../../bin')
      expect(resolveMock).toBeCalledWith('joinpath', `./${CKBLightRunner.getInstance().platform()}`, './ckb-light-client')
      CKBLightRunner.getInstance().platform = tmp
    })
  })

  describe('test templateConfigFile', () => {
    it('app is packaged', () => {
      isPackagedMock.mockReturnValue(true)
      dirnameMock.mockReturnValue('dir')
      joinMock.mockReturnValue('join')
      resolveMock.mockReturnValue('resolve')
      expect(CKBLightRunner.getInstance().templateConfigFile).toBe('resolve')
      expect(joinMock).toBeCalledWith('dir', '..', './light')
      expect(resolveMock).toBeCalledWith('join', './ckb_light.toml')
    })
    it('app is not packaged', () => {
      isPackagedMock.mockReturnValue(false)
      dirnameMock.mockReturnValue('dir')
      joinMock.mockReturnValue('join')
      resolveMock.mockReturnValue('resolve')
      expect(CKBLightRunner.getInstance().templateConfigFile).toBe('resolve')
      expect(joinMock).toBeCalledWith(lightRunnerDirpath, '../../light')
      expect(resolveMock).toBeCalledWith('join', './ckb_light.toml')
    })
  })

  describe('test configFile', () => {
    lightDataPathMock.mockReturnValue('lightDataPath')
    CKBLightRunner.getInstance().configFile
    expect(resolveMock).toBeCalledWith('lightDataPath', './ckb_light.toml')
  })

  describe('test initConfig', () => {
    it('configFile is exist', () => {
      existsSyncMock.mockReturnValue(true)
      CKBLightRunner.getInstance().initConfig()
      expect(readFileSyncMock).toBeCalledTimes(0)
    })
    it('configFile is not exist replace store path and network path', () => {
      existsSyncMock.mockReturnValue(false)
      readFileSyncMock.mockReturnValue('[store]\npath=aaa\n[network]\npath=bbb')
      lightDataPathMock.mockReturnValue('light-data-path')
      joinMock.mockReturnValue('new-path')
      resolveMock.mockReturnValue('config')
      CKBLightRunner.getInstance().initConfig()
      expect(mkdirSyncMock).toBeCalledWith('light-data-path', { recursive: true })
      expect(writeFileSyncMock).toBeCalledWith('config', '[store]\npath = "new-path"\n[network]\npath = "new-path"')
    })
  })

  describe('test start', () => {
    it('when runnerProces is not undefined', async () => {
      const tmp = CKBLightRunner.getInstance().stop
      CKBLightRunner.getInstance().stop = mockFn
      CKBLightRunner.getInstance().runnerProces = {}
      const eventEmitter = new EventEmitter()
      spawnMock.mockReturnValue(eventEmitter)
      existsSyncMock.mockReturnValue(true)
      await CKBLightRunner.getInstance().start()
      expect(mockFn).toBeCalledTimes(1)
      expect(resetSyncTaskQueueMock).toHaveBeenLastCalledWith(true)
      CKBLightRunner.getInstance().stop = tmp
    })
    it('when runnerProces is undefined', async () => {
      const tmp = CKBLightRunner.getInstance().stop
      CKBLightRunner.getInstance().stop = mockFn
      CKBLightRunner.getInstance().runnerProces = undefined
      const eventEmitter = new EventEmitter()
      spawnMock.mockReturnValue(eventEmitter)
      existsSyncMock.mockReturnValue(true)
      await CKBLightRunner.getInstance().start()
      expect(mockFn).toBeCalledTimes(0)
      expect(resetSyncTaskQueueMock).toHaveBeenLastCalledWith(true)
      CKBLightRunner.getInstance().stop = tmp
    })
    it('when runnerProces is undefined and on error', async () => {
      CKBLightRunner.getInstance().runnerProces = undefined
      const eventEmitter = new EventEmitter()
      spawnMock.mockReturnValue(eventEmitter)
      existsSyncMock.mockReturnValue(true)
      await CKBLightRunner.getInstance().start()
      expect(CKBLightRunner.getInstance().runnerProces).toBeDefined()
      expect(mockFn).toBeCalledTimes(0)
      expect(resetSyncTaskQueueMock).toHaveBeenLastCalledWith(true)
      eventEmitter.emit('error', 'errorInfo')
      expect(loggerErrorMock).toBeCalledWith('CKBLightRunner:\trun fail:', 'errorInfo')
      expect(CKBLightRunner.getInstance().runnerProces).toBeUndefined()
    })
    it('when runnerProces is undefined and on close', async () => {
      CKBLightRunner.getInstance().runnerProces = undefined
      const eventEmitter = new EventEmitter()
      spawnMock.mockReturnValue(eventEmitter)
      existsSyncMock.mockReturnValue(true)
      await CKBLightRunner.getInstance().start()
      expect(CKBLightRunner.getInstance().runnerProces).toBeDefined()
      expect(mockFn).toBeCalledTimes(0)
      expect(resetSyncTaskQueueMock).toHaveBeenLastCalledWith(true)
      eventEmitter.emit('close', 'closeInfo')
      expect(loggerInfoMock).toBeCalledWith('CKBLightRunner:\tprocess closed')
      expect(CKBLightRunner.getInstance().runnerProces).toBeUndefined()
    })
    it('when runnerProces is undefined and on stderr', async () => {
      CKBLightRunner.getInstance().runnerProces = undefined
      const eventEmitter: EventEmitter & { stderr?: EventEmitter } = new EventEmitter()
      eventEmitter.stderr = new EventEmitter()
      spawnMock.mockReturnValue(eventEmitter)
      existsSyncMock.mockReturnValue(true)
      await CKBLightRunner.getInstance().start()
      expect(CKBLightRunner.getInstance().runnerProces).toBeDefined()
      expect(mockFn).toBeCalledTimes(0)
      expect(resetSyncTaskQueueMock).toHaveBeenLastCalledWith(true)
      eventEmitter.stderr.emit('data', 'error-data')
      expect(loggerErrorMock).toBeCalledWith('CKBLightRunner:\trun fail:', 'error-data')
      expect(CKBLightRunner.getInstance().runnerProces).toBeUndefined()
    })
  })

  describe('test stop', () => {
    it('runnerProces is undefined', async () => {
      CKBLightRunner.getInstance().runnerProces = undefined
      await CKBLightRunner.getInstance().stop()
      expect(resetSyncTaskQueueMock).toBeCalledWith(false)
    })
    it('runnerProces is defined', async () => {
      const emitter: EventEmitter & { kill?: Function } = new EventEmitter()
      emitter.kill = mockFn
      CKBLightRunner.getInstance().runnerProces = emitter
      mockFn.mockImplementation(() => { emitter.emit('close') })
      await CKBLightRunner.getInstance().stop()
      expect(mockFn).toBeCalledWith('SIGKILL')
      expect(CKBLightRunner.getInstance().runnerProces).toBeUndefined()
    })
  })
})
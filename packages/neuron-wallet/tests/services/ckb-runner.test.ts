import { EventEmitter } from 'typeorm/platform/PlatformTools'
import path from 'path'

const stubbedChildProcess = jest.fn()
const stubbedSpawn = jest.fn()
const stubbedExistsSync = jest.fn()

const stubbedLoggerInfo = jest.fn()
const stubbedLoggerError = jest.fn()
const stubbedLoggerLog = jest.fn()
const resetSyncTaskQueueAsyncPushMock = jest.fn()
const updateTomlMock = jest.fn()
const getUsablePortMock = jest.fn()

const stubbedProcess: any = {}

const resetMocks = () => {
  stubbedChildProcess.mockReset()
  stubbedSpawn.mockReset()
  stubbedExistsSync.mockReset()
  stubbedLoggerInfo.mockReset()
  stubbedLoggerError.mockReset()
  stubbedLoggerLog.mockReset()
  resetSyncTaskQueueAsyncPushMock.mockReset()
  updateTomlMock.mockReset()
  getUsablePortMock.mockReset()
}

jest.doMock('child_process', () => {
  return {
    ChildProcess: stubbedChildProcess,
    spawn: stubbedSpawn,
  }
})
jest.doMock('fs', () => {
  return {
    __esModule: true,
    default: {
      existsSync: stubbedExistsSync,
    },
  }
})

const app = {
  getAppPath: () => '/',
  getPath: () => '/',
  isPackaged: false,
}
jest.doMock('env', () => {
  return {
    app,
  }
})
jest.doMock('utils/logger', () => {
  return {
    info: stubbedLoggerInfo,
    error: stubbedLoggerError,
    log: stubbedLoggerLog,
  }
})
jest.doMock('process', () => {
  return stubbedProcess
})

const ckbDataPath = '/chains/mainnet'
jest.mock('../../src/services/settings', () => ({
  getInstance() {
    return {
      getNodeDataPath() {
        return ckbDataPath
      },
    }
  },
}))
jest.mock('../../src/block-sync-renderer', () => ({
  resetSyncTaskQueue: {
    push: jest.fn(),
  },
}))
jest.mock('../../src/services/indexer', () => ({
  cleanOldIndexerData: jest.fn(),
}))
jest.doMock('../../src/block-sync-renderer', () => ({
  resetSyncTaskQueue: {
    asyncPush: resetSyncTaskQueueAsyncPushMock,
  },
}))
jest.doMock('../../src/utils/toml', () => ({
  updateToml: updateTomlMock,
}))
jest.doMock('../../src/utils/get-usable-port', () => ({
  getUsablePort: getUsablePortMock,
}))
const { startCkbNode, stopCkbNode, migrateCkbData, getNodeUrl } = require('../../src/services/ckb-runner')

describe('ckb runner', () => {
  let stubbedCkb: any = new EventEmitter()
  beforeEach(() => {
    resetMocks()

    stubbedCkb.kill = jest.fn()
    stubbedCkb.stderr = new EventEmitter()
    stubbedCkb.stdout = new EventEmitter()
    stubbedSpawn.mockReturnValue(stubbedCkb)
    resetSyncTaskQueueAsyncPushMock.mockReturnValue('')
    getUsablePortMock.mockImplementation(v => Promise.resolve(v))
  })
  ;[
    { platform: 'win32', platformPath: 'win' },
    { platform: 'linux', platformPath: 'linux' },
    { platform: 'darwin', platformPath: 'mac' },
    { platform: '_', platformPath: '' },
  ].forEach(({ platform, platformPath }) => {
    describe(`#startCkbNode on ${platform}`, () => {
      beforeEach(() => {
        stubbedProcess.platform = platform
      })
      describe('with config file', () => {
        beforeEach(async () => {
          stubbedExistsSync.mockReturnValue(true)
          await startCkbNode()
        })
        afterEach(async () => {
          const promise = stopCkbNode()
          stubbedCkb.emit('close')
          await promise
        })
        it('should not init ckb config', async () => {
          expect(stubbedSpawn).not.toHaveBeenCalledWith(expect.stringContaining('/ckb'), [
            'init',
            '--chain',
            'mainnet',
            '-C',
            ckbDataPath,
          ])
        })
        it('runs ckb binary', () => {
          expect(stubbedSpawn).toHaveBeenCalledWith(
            expect.stringContaining(path.join(platformPath, 'ckb')),
            ['run', '-C', ckbDataPath, '--indexer'],
            { stdio: ['ignore', 'pipe', 'pipe'] }
          )
        })
      })

      describe('without config file', () => {
        let promise: any
        beforeEach(async () => {
          stubbedExistsSync.mockReturnValue(false)
          promise = startCkbNode()
        })
        describe('success', () => {
          beforeEach(async () => {
            stubbedCkb.emit('close')
            await promise
          })
          afterEach(async () => {
            const stopPromise = stopCkbNode()
            stubbedCkb.emit('close')
            await stopPromise
          })
          it('inits ckb config', () => {
            expect(stubbedSpawn).toHaveBeenCalledWith(expect.stringContaining(path.join(platformPath, 'ckb')), [
              'init',
              '--chain',
              'mainnet',
              '-C',
              ckbDataPath,
            ])
          })
          it('runs ckb binary', () => {
            expect(stubbedSpawn).toHaveBeenCalledWith(
              expect.stringContaining(path.join(platformPath, 'ckb')),
              ['run', '-C', ckbDataPath, '--indexer'],
              { stdio: ['ignore', 'pipe', 'pipe'] }
            )
          })
        })
        describe('fails', () => {
          let hasError: boolean = false
          beforeEach(async () => {
            stubbedCkb.emit('error')
            try {
              await promise
            } catch (err) {
              hasError = true
            }
          })
          it('throws error', () => {
            expect(hasError).toEqual(true)
          })
        })
      })

      it('port is not usable', async () => {
        stubbedExistsSync.mockReturnValue(true)
        getUsablePortMock.mockReset()
        getUsablePortMock.mockImplementation(v => Promise.resolve(v)).mockResolvedValueOnce(8114)
        await startCkbNode()
        expect(getNodeUrl()).toBe('http://127.0.0.1:8114')
        expect(getUsablePortMock).toHaveBeenLastCalledWith(8115)
        expect(updateTomlMock).toBeCalledWith(path.join('/chains/mainnet', 'ckb.toml'), {
          rpc: {
            listen_address: `"127.0.0.1:8114"`,
          },
          network: {
            listen_addresses: `["/ip4/0.0.0.0/tcp/8115"]`,
          },
        })
        const promise = stopCkbNode()
        stubbedCkb.emit('close')
        await promise
      })

      it('port is usable', async () => {
        stubbedExistsSync.mockReturnValue(true)
        getUsablePortMock.mockResolvedValueOnce(8115).mockResolvedValueOnce(8116)
        await startCkbNode()
        expect(getNodeUrl()).toBe('http://127.0.0.1:8115')
        expect(getUsablePortMock).toHaveBeenLastCalledWith(8116)
        expect(updateTomlMock).toBeCalledWith(path.join('/chains/mainnet', 'ckb.toml'), {
          rpc: {
            listen_address: `"127.0.0.1:8115"`,
          },
          network: {
            listen_addresses: `["/ip4/0.0.0.0/tcp/8116"]`,
          },
        })
        let promise = stopCkbNode()
        stubbedCkb.emit('close')
        await promise
        // reset port
        getUsablePortMock.mockResolvedValueOnce(8114).mockResolvedValueOnce(8115)
        await startCkbNode()
        promise = stopCkbNode()
        stubbedCkb.emit('close')
        await promise
      })
    })
  })
  describe('#stopCkbNode', () => {
    beforeEach(async () => {
      stubbedExistsSync.mockReturnValue(true)
      await startCkbNode()
      stubbedCkb.kill = jest.fn()
      stopCkbNode()
    })
    it('kill ckb process', () => {
      expect(stubbedCkb.kill).toHaveBeenCalled()
    })
  })
})

const migrateNextMock = jest.fn()

jest.mock('../../src/models/subjects/migrate-subject', () => ({
  next: (v: string) => migrateNextMock(v),
}))

describe('ckb migrate', () => {
  let stubbedCkb: any = new EventEmitter()
  beforeEach(() => {
    resetMocks()
    stubbedSpawn.mockReturnValue(stubbedCkb)
  })
  it('start migrate', async () => {
    await migrateCkbData()
    expect(migrateNextMock).toBeCalledWith({ type: 'migrating' })
  })
  it('migrate failed', async () => {
    stubbedCkb.emit('close', 1)
    await migrateCkbData()
    expect(migrateNextMock).toBeCalledWith({ type: 'failed', reason: '' })
  })
  it('migrate finish', async () => {
    stubbedCkb.emit('close', 0)
    await migrateCkbData()
    expect(migrateNextMock).toBeCalledWith({ type: 'finish' })
  })
})

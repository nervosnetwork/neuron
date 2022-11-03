import { EventEmitter } from 'typeorm/platform/PlatformTools'
import path from 'path'

const stubbedChildProcess = jest.fn()
const stubbedSpawn = jest.fn()
const stubbedExistsSync = jest.fn()

const stubbedLoggerInfo = jest.fn()
const stubbedLoggerError = jest.fn()
const stubbedLoggerLog = jest.fn()

const stubbedProcess: any = {}

const resetMocks = () => {
  stubbedChildProcess.mockReset()
  stubbedSpawn.mockReset()
  stubbedExistsSync.mockReset()
  stubbedLoggerInfo.mockReset()
  stubbedLoggerError.mockReset()
  stubbedLoggerLog.mockReset()
}

jest.doMock('child_process', () => {
  return {
    ChildProcess: stubbedChildProcess,
    spawn: stubbedSpawn
  }
})
jest.doMock('fs', () => {
  return {
    __esModule: true,
    default: {
      existsSync: stubbedExistsSync
    }
  }
})

const app = {
  getAppPath: () => '/',
  getPath: () => '/',
  isPackaged: false
}
jest.doMock('env', () => {
  return {
    app
  }
})
jest.doMock('utils/logger', () => {
  return {
    info: stubbedLoggerInfo,
    error: stubbedLoggerError,
    log: stubbedLoggerLog
  }
})
jest.doMock('process', () => {
  return stubbedProcess
})

const ckbDataPath = '/chains/mainnet'
jest.mock('../../src/services/settings', () => ({
  getInstance() {
    return {
      ckbDataPath
    }
  }
}))
jest.mock('../../src/block-sync-renderer', () => ({
  resetSyncTaskQueue: {
    push: jest.fn()
  }
}))
const { startCkbNode, stopCkbNode, getLookingValidTargetStatus, migrateCkbData } = require('../../src/services/ckb-runner')

describe('ckb runner', () => {
  let stubbedCkb: any = new EventEmitter()
  beforeEach(() => {
    resetMocks()

    stubbedCkb.stderr = new EventEmitter()
    stubbedCkb.stdout = new EventEmitter()
    stubbedSpawn.mockReturnValue(stubbedCkb)
  })
  ;[
    { platform: 'win32', platformPath: 'win' },
    { platform: 'linux', platformPath: 'linux' },
    { platform: 'darwin', platformPath: 'mac' },
    { platform: '_', platformPath: '' }
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
        it('should not init ckb config', () => {
          expect(stubbedSpawn).not.toHaveBeenCalledWith(expect.stringContaining('/ckb'), [
            'init',
            '--chain',
            'mainnet',
            '-C',
            ckbDataPath
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
          it('inits ckb config', () => {
            expect(stubbedSpawn).toHaveBeenCalledWith(expect.stringContaining(path.join(platformPath, 'ckb')), [
              'init',
              '--chain',
              'mainnet',
              '-C',
              ckbDataPath
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

      describe('with assume valid target', () => {
        beforeEach(async () => {
          app.isPackaged = true
          stubbedProcess.env = { CKB_NODE_ASSUME_VALID_TARGET: '0x' + '0'.repeat(64) }
          stubbedExistsSync.mockReturnValue(true)
          await startCkbNode()
        })
        afterEach(() => {
          app.isPackaged = false
          stubbedProcess.env = {}
        })
        it('is Looking valid target', () => {
          stubbedCkb.stdout.emit(
            'data',
            `can't find assume valid target temporarily, hash: Byte32(0x${'0'.repeat(64)})`
          )
          expect(getLookingValidTargetStatus()).toBeTruthy()
          stubbedCkb.emit('close')
        })
        it('is Looking valid target', async () => {
          stubbedCkb.stdout.emit(
            'data',
            `can't find assume valid target temporarily, hash: Byte32(0x${'0'.repeat(64)})`
          )
          await new Promise(resolve =>
            setTimeout(() => {
              resolve(undefined)
            }, 11000)
          )
          stubbedCkb.stdout.emit('data', `had find valid target`)
          expect(getLookingValidTargetStatus()).toBeFalsy()
          stubbedCkb.emit('close')
        }, 15000)
        it('ckb has closed', async () => {
          stubbedCkb.stdout.emit(
            'data',
            `can't find assume valid target temporarily, hash: Byte32(0x${'0'.repeat(64)})`
          )
          stubbedCkb.emit('close')
          expect(getLookingValidTargetStatus()).toBeFalsy()
        })
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
  next: (v: string) => migrateNextMock(v)
}))

describe('ckb migrate', () => {
  let stubbedCkb: any = new EventEmitter()
  beforeEach(() => {
    resetMocks()
    stubbedSpawn.mockReturnValue(stubbedCkb)
  })
  it('start migrate', async () => {
    await migrateCkbData()
    expect(migrateNextMock).toBeCalledWith('migrating')
  })
  it('migrate failed', async () => {
    stubbedCkb.emit('close', 1)
    await migrateCkbData()
    expect(migrateNextMock).toBeCalledWith('failed')
  })
  it('migrate finish', async () => {
    stubbedCkb.emit('close', 0)
    await migrateCkbData()
    expect(migrateNextMock).toBeCalledWith('finish')
  })
})
import { EventEmitter } from "typeorm/platform/PlatformTools"
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
      existsSync: stubbedExistsSync,
    }
  }
})
jest.doMock('env', () => {
  return {
    app: {
      getAppPath: () => '/',
      getPath: () => '/'
    },
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
const {startCkbNode, stopCkbNode} = require('../../src/services/ckb-runner')

describe('ckb runner', () => {
  let stubbedCkb: any = new EventEmitter()
  beforeEach(() => {
    resetMocks()

    stubbedCkb.stderr = new EventEmitter()
    stubbedCkb.stdout = new EventEmitter()
    stubbedSpawn.mockReturnValue(stubbedCkb)
  });

  [
    {platform: 'win32', platformPath: 'win'},
    {platform: 'linux', platformPath: 'linux'},
    {platform: 'darwin', platformPath: 'mac'},
    {platform: '_', platformPath: ''},
  ].forEach(({platform, platformPath}) => {
    describe(`#startCkbNode on ${platform}`, () => {
      beforeEach(() => {
        stubbedProcess.platform = platform
      });
      describe('with config file', () => {
        beforeEach(async () => {
          stubbedExistsSync.mockReturnValue(true)
          await startCkbNode()
        });
        it('should not init ckb config', () => {
          expect(stubbedSpawn).not.toHaveBeenCalledWith(
            expect.stringContaining('/ckb'),
            ['init', '--chain', 'mainnet', '-C', expect.stringContaining(path.join('chains','mainnet'))]
          )
        })
        it('runs ckb binary', () => {
          expect(stubbedSpawn).toHaveBeenCalledWith(
            expect.stringContaining(path.join(platformPath,'ckb')),
            ['run', '-C', expect.stringContaining(path.join('chains','mainnet'))],
            {'stdio': ['ignore', 'ignore', 'pipe']}
          )
        })
      });

      describe('without config file', () => {
        let promise: any
        beforeEach(async () => {
          stubbedExistsSync.mockReturnValue(false)
          promise = startCkbNode()
        });
        describe('success', () => {
          beforeEach(async () => {
            stubbedCkb.emit('close')
            await promise
          });
          it('inits ckb config', () => {
            expect(stubbedSpawn).toHaveBeenCalledWith(
              expect.stringContaining(path.join(platformPath,'ckb')),
              ['init', '--chain', 'mainnet', '-C', expect.stringContaining(path.join('chains','mainnet'))]
            )
          })
          it('runs ckb binary', () => {
            expect(stubbedSpawn).toHaveBeenCalledWith(
              expect.stringContaining(path.join(platformPath,'ckb')),
              ['run', '-C', expect.stringContaining(path.join('chains','mainnet'))],
              {'stdio': ['ignore', 'ignore', 'pipe']}
            )
          })
        });
        describe('fails', () => {
          let hasError: boolean = false
          beforeEach(async () => {
            stubbedCkb.emit('error')
            try {
              await promise
            } catch (err) {
              hasError = true
            }
          });
          it('throws error', () => {
            expect(hasError).toEqual(true)
          })
        });
      });
    })
  })
  describe('#stopCkbNode', () => {
    beforeEach(async () => {
      stubbedExistsSync.mockReturnValue(true)
      await startCkbNode()
      stubbedCkb.kill = jest.fn()
      stopCkbNode()
    });
    it('kill ckb process', () => {
      expect(stubbedCkb.kill).toHaveBeenCalled()
    })
  })
});

import path from 'path'
import { fork } from 'child_process'

let expose: any, spawn: any, terminate: any, subscribe: any

const noop = (..._: any) => undefined
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const stubbedLoggerError = jest.fn()

const resetMock = () => {
  stubbedLoggerError.mockReset()
}

describe('utils/workers', () => {
  beforeEach(() => {
    resetMock()

    jest.doMock('../../src/utils/logger', () => {
      return {
        error: stubbedLoggerError
      }
    })

    expose = require('../../src/utils/worker').expose
    spawn = require('../../src/utils/worker').spawn
    terminate = require('../../src/utils/worker').terminate
    subscribe = require('../../src/utils/worker').subscribe

  });
  describe('expose', () => {
    let ChildProcessSendSpy: any

    beforeEach(() => {
      ChildProcessSendSpy = jest.spyOn(process, 'send')
    })

    afterEach(() => {
      ChildProcessSendSpy.mockRestore()
    })

    beforeEach(async () => {
      expose({
        test1: noop,
        test2: noop
      })
      // wait for macrotask executed
      await delay(10)
    })

    it('expose should send object keys as channels to the master process', async () => {
      expect(ChildProcessSendSpy).toHaveBeenCalledWith({ channels: ['test1', 'test2'] })
    })
  })

  describe('spawn', () => {
    let Worker: any
    let childProcess: any
    beforeAll(async () => {
      childProcess = fork(path.join(__dirname, 'fixtures', 'worker.js'))
      Worker = await spawn(childProcess)
    })

    afterAll(async () => {
      await terminate(Worker)
    })

    it('spawn handler can execute a function but return nothing', async () => {
      const res = await Worker.doNothing()
      expect(res).toBe(undefined)
    })

    it('spawn handler can execute a async/await function', async () => {
      const res = await Worker.async()
      expect(res).toBe('async/await')
    })

    it('spawn handler can execute a normal function', async () => {
      const res = await Worker.normal()
      expect(res).toBe('normal')
    })

    it('spawn handler can return aruguments', async () => {
      const res = await Worker.args(1, 2, 3)
      expect(res).toEqual([1, 2, 3])
    })

    describe('handles concurrent requests', () => {
      let results: any[] = []
      beforeEach(async () => {
        results = await Promise.all([
          Worker.async(),
          Worker.normal(),
          Worker.doNothing(),
          Worker.args(4, 5, 6),
        ])
      })
      it('processes responses in correct order', () => {
        expect(results).toEqual([
          'async/await',
          'normal',
          undefined,
          [4, 5, 6]
        ])
      })
    });
    describe('childProcess#send throws error', () => {
      let error: any
      beforeEach(async () => {
        jest.spyOn(childProcess, 'send').mockImplementation((_request, callback: any) => {
          callback(new Error('err'))
        })
        try {
          await Worker.normal()
        } catch (err) {
          error = err
        }
      });
      it('rethrows error', () => {
        expect(error).toEqual(new Error('err'))
      })
      it('logs error', async () => {
        expect(stubbedLoggerError).toHaveBeenCalledWith('Error sending message to child process Error: err')
      })
    });
  })

  describe('terminate', () => {
    let Worker: any

    beforeEach(async () => {
      Worker = await spawn(
        fork(path.join(__dirname, 'fixtures', 'worker.js'))
      )
    })

    it('terminate should close ipc connection', async () => {
      await terminate(Worker)
      expect(Worker?.$worker?.connected).toBe(false)
    })

    it('terminate should kill the child process', async () => {
      await terminate(Worker)
      expect(Worker?.$worker?.killed).toBe(true)
    })

    describe('with requests in process', () => {
      let requests: any
      beforeEach(async () => {
        requests = Promise.all([
          Worker.async(),
          Worker.async(),
        ])
        await terminate(Worker)
      })
      it('drains and hangs up requests with undefined response', async () => {
        const results = await requests
        expect(results).toEqual([undefined, undefined])
      })
    });

  })

  describe('subscribe', () => {
    const stubbedaddEventListener = jest.fn()

    afterEach(() => {
      stubbedaddEventListener.mockRestore()
    })

    it('subscribe should start a listener in worker instance', () => {
      subscribe({
        $worker: {
          on: stubbedaddEventListener
        } as any
      }, noop)
      expect(stubbedaddEventListener).toHaveBeenCalledWith('message', noop)
    })
  })
})

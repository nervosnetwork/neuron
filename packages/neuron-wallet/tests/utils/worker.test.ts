import path from 'path'
import { expose, spawn, terminate, subscribe } from '../../src/utils/worker'
import { fork } from 'child_process'

const noop = (..._: any) => undefined
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('utils/workers', () => {
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

    beforeAll(async () => {
      Worker = await spawn(
        fork(path.join(__dirname, 'fixtures', 'worker.js'))
      )
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
  })

  describe('terminate', () => {
    let handlers: any

    beforeEach(async () => {
      handlers = await spawn(
        fork(path.join(__dirname, 'fixtures', 'worker.js'))
      )
    })

    it('terminate should close ipc connection', async () => {
      await terminate(handlers)
      expect(handlers?.$worker?.connected).toBe(false)
    })

    it('terminate should kill the child process', async () => {
      await terminate(handlers)
      expect(handlers?.$worker?.killed).toBe(true)
    })
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

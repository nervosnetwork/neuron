import path from 'path'
import { expose, spawn, terminate, subscribe } from '../../src/utils/worker'
import { fork } from 'child_process'

const noop = (..._: any) => undefined
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('utils/workers', () => {
  describe('expose', () => {
    let processSendSpy: any

    beforeEach(() => {
      processSendSpy = jest.spyOn(process, 'send')
    })

    afterEach(() => {
      processSendSpy.mockRestore()
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
      expect(processSendSpy).toHaveBeenCalledWith({ channels: ['test1', 'test2'] })
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

import path from 'path'
import { expose, spawn, terminate } from '../../src/utils/worker'
import { fork } from 'child_process'

describe('workers', () => {
  const noop = (..._: any) => undefined
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  it('expose should send object keys as channels to the master process', async () => {
    const sendSpy = jest.spyOn(process, 'send')
    expose({
      test1: noop,
      test2: noop
    })
    await delay(10)
    expect(sendSpy).toHaveBeenCalledWith({ channels: ['test1', 'test2'] })
    sendSpy.mockRestore()
  })

  it('spawn should work with expose', async () => {
    const handlers = await spawn(
      fork(path.join(__dirname, 'fixtures', 'worker.js'))
    )

    const f1 = await handlers.f1()
    expect(f1).toBe(undefined)
    const f2 = await handlers.f2()
    expect(f2).toBe('f2')
    const f3 = await handlers.f3()
    expect(f3).toBe('f3')
    const f4 = await handlers.f4(1, 2, 3)
    expect(f4).toEqual([1, 2, 3])

    await terminate(handlers)
  })

  it('terminate should work', async () => {
    const handlers = await spawn(
      fork(path.join(__dirname, 'fixtures', 'worker.js'))
    )

    await terminate(handlers)

    expect(handlers?.$worker?.connected).toBe(false)
    expect(handlers?.$worker?.killed).toBe(true)
  })
})

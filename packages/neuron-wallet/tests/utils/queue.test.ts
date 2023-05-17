import queueWrapper from '../../src/utils/queue'

const fnMock = jest.fn()
function createPromise(timer: number, result?: any, isReject: boolean = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isReject) {
        reject(new Error(result))
        return
      }
      resolve(result | timer)
    }, timer)
  })
}

describe('queueWrapper', () => {
  beforeEach(() => {
    fnMock.mockReset()
  })

  it('asyncPush promise resolve', async () => {
    const q = queueWrapper(fnMock)
    fnMock.mockReturnValueOnce(createPromise(400))
    const res = await q.asyncPush(1)
    expect(res).toBe(400)
  })

  it('asyncPush promise reject', async () => {
    const q = queueWrapper(fnMock)
    fnMock.mockReturnValueOnce(createPromise(400, 'reject error', true))
    await expect(q.asyncPush(1)).rejects.toThrow(new Error('reject error'))
  })

  it('asyncPush excute by order', async () => {
    const q = queueWrapper(fnMock)
    fnMock
      .mockReturnValueOnce(createPromise(400))
      .mockReturnValueOnce(createPromise(200))
      .mockReturnValueOnce(createPromise(100))
    q.asyncPush(1)
    q.asyncPush(2)
    q.asyncPush(3)
    await q.drain()
    expect(fnMock).toHaveBeenNthCalledWith(1, 1)
    expect(fnMock).toHaveBeenNthCalledWith(2, 2)
    expect(fnMock).toHaveBeenNthCalledWith(3, 3)
  })

  it('asyncPush excute by order and ignore same item', async () => {
    const q = queueWrapper(fnMock, 1, true)
    fnMock
      .mockReturnValueOnce(createPromise(400))
      .mockReturnValueOnce(createPromise(300))
      .mockReturnValueOnce(createPromise(300))
    q.asyncPush(1)
    q.asyncPush(2)
    q.asyncPush(2)
    await q.drain()
    expect(fnMock).toHaveBeenCalledTimes(2)
    expect(fnMock).toHaveBeenNthCalledWith(1, 1)
    expect(fnMock).toHaveBeenNthCalledWith(2, 2)
  })
})

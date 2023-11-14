import { getUsablePort } from '../../src/utils/get-usable-port'

const connectMock = jest.fn()
const onceMock = jest.fn()

jest.mock('net', () => {
  const Socket = function () {
    return {
      connect: connectMock,
      once: onceMock,
      setTimeout() {},
      destroy() {},
      end() {},
    }
  }
  return {
    Socket,
  }
})

function resetMock() {
  onceMock.mockReset()
  connectMock.mockReset()
}

describe('test get usable port', () => {
  beforeEach(() => {
    resetMock()
  })
  it('port not be used', async () => {
    onceMock.mockImplementationOnce((_: string, callback: () => void) => {
      callback()
    })
    const port = await getUsablePort(8000)
    expect(port).toBe(8000)
  })
  it('port is used', async () => {
    connectMock.mockImplementation((_: string, __: string, callback: () => void) => {
      callback()
    })
    expect(getUsablePort(8000)).rejects.toThrow('Can not find usable port by from 8000 to 8002')
  })
  it('port is find at next', async () => {
    connectMock.mockImplementationOnce((_: string, __: string, callback: () => void) => {
      callback()
    })
    let callTime = 0
    onceMock.mockImplementation((_: string, callback: () => void) => {
      if (callTime >= 2) {
        callback()
      } else {
        callTime += 1
      }
    })
    const port = await getUsablePort(8000)
    expect(port).toBe(8001)
  })
})

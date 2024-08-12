import { rpcBatchRequest, rpcRequest } from '../../src/utils/rpc-request'

describe('rpc-batch-request', () => {
  const options = [
    {
      method: 'get_block',
      params: 1,
    },
    {
      method: 'get_block',
      params: 2,
    },
  ]
  it('fetch error', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 500,
      })
    ) as jest.Mock
    await expect(rpcBatchRequest('url', options)).rejects.toThrow(
      new Error(`indexer request failed with HTTP code 500`)
    )
  })
  it('result is order by id', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json() {
          return Promise.resolve([
            {
              id: 2,
              result: 2,
            },
            {
              id: 1,
              result: 1,
            },
          ])
        },
      })
    ) as jest.Mock

    const res = await rpcBatchRequest('url', options)
    expect(res).toEqual([
      {
        id: 1,
        result: 1,
      },
      {
        id: 2,
        result: 2,
      },
    ])
  })
})

describe('rpc-request', () => {
  const option = {
    method: 'get_block',
    params: 1,
  }
  it('fetch error', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 500,
      })
    ) as jest.Mock
    await expect(rpcRequest('url', option)).rejects.toThrow(new Error(`indexer request failed with HTTP code 500`))
  })
  it('fetch success', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json() {
          return Promise.resolve({
            id: 2,
            result: 2,
          })
        },
      })
    ) as jest.Mock
    const res = await rpcRequest('url', option)
    expect(res).toEqual(2)
  })
})

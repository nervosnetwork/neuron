
import { rpcBatchRequest } from '../../src/utils/rpc-request'

const postMock = jest.fn()
jest.mock('axios', () => ({
  post: () => postMock()
}))

describe('rpc-request', () => {
  const options = [
    {
      method: 'get_block',
      params: 1
    },
    {
      method: 'get_block',
      params: 2
    }
  ]
  it('fetch error', async () => {
    postMock.mockResolvedValueOnce({ status: 500 })
    await expect(rpcBatchRequest('url', options)).rejects.toThrow(new Error(`indexer request failed with HTTP code 500`))
  })
  it('result is order by id', async () => {
    postMock.mockResolvedValueOnce({
      status: 200,
      data: [
        {
          id: 2,
          result: 2
        },
        {
          id: 1,
          result: 1
        }
      ]
    })
    const res = await rpcBatchRequest('url', options)
    expect(res).toEqual([
      {
        id: 1,
        result: 1
      },
      {
        id: 2,
        result: 2
      }
    ])
  })
})
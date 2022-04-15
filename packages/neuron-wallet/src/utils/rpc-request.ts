import axios from 'axios'

export const rpcBatchRequest = async (
  ckbIndexerUrl: string,
  options: {
    method: string
    params?: any
  }[]
): Promise<any[]> => {
  const res = await axios({
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    data: options.map(v => ({
      id: 0,
      jsonrpc: '2.0',
      method: v.method,
      params: v.params
    })),
    url: ckbIndexerUrl
  })
  if (res.status !== 200) {
    throw new Error(`indexer request failed with HTTP code ${res.status}`)
  }
  return res.data
}

export default {
  rpcBatchRequest
}

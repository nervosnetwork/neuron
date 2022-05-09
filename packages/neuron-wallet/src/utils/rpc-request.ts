import axios from 'axios'

export const rpcBatchRequest = async (
  ckbIndexerUrl: string,
  options: {
    method: string
    params?: any
  }[]
): Promise<any[]> => {
  const res = await axios.post<{ id: number; error?: any; result: any }[]>(
    ckbIndexerUrl,
    options.map((v, idx) => ({
      id: idx,
      jsonrpc: '2.0',
      method: v.method,
      params: v.params
    })),
    {
      headers: {
        'content-type': 'application/json'
      }
    }
  )
  if (res.status !== 200) {
    throw new Error(`indexer request failed with HTTP code ${res.status}`)
  }
  return res.data.sort((a, b) => a.id - b.id)
}

export default {
  rpcBatchRequest
}

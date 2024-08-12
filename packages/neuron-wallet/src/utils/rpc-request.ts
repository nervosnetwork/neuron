export const rpcRequest = async <T = any>(
  url: string,
  options: {
    method: string
    params?: any
  }
): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      id: 0,
      jsonrpc: '2.0',
      method: options.method,
      params: options.params,
    }),
    headers: {
      'content-type': 'application/json',
    },
  })
  if (res.status !== 200) {
    throw new Error(`indexer request failed with HTTP code ${res.status}`)
  }
  const body = await res.json()
  if (body !== null && typeof body === 'object' && 'result' in body) {
    return body?.result as T
  }
  return [] as T
}

export const rpcBatchRequest = async (
  url: string,
  options: {
    method: string
    params?: any
  }[]
): Promise<any[]> => {
  const res = await fetch(url, {
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(
      options.map((v, idx) => ({
        id: idx,
        jsonrpc: '2.0',
        method: v.method,
        params: v.params,
      }))
    ),
  })
  if (res.status !== 200) {
    throw new Error(`indexer request failed with HTTP code ${res.status}`)
  }
  const responseBody = await res.json()
  if (Array.isArray(responseBody) && responseBody.every(i => 'id' in i)) {
    return responseBody.sort((a, b) => a.id - b.id)
  }
  return []
}

export default {
  rpcBatchRequest,
  rpcRequest,
}

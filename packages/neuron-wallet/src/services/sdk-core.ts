import CKB from '@nervosnetwork/ckb-sdk-core'
import https from 'https'
import http from 'http'

export const generateCKB = (url: string): CKB => {
  const ckb = new CKB(url)
  if (url.startsWith('https')) {
    const httpsAgent = new https.Agent({ keepAlive: true })
    ckb.rpc.setNode({ url, httpsAgent })
  } else {
    const httpAgent = new http.Agent({ keepAlive: true })
    ckb.rpc.setNode({ url, httpAgent })
  }
  return ckb
}

export default {
  generateCKB
}

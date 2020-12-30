import CKB from '@nervosnetwork/ckb-sdk-core'
import https from 'https'
import http from 'http'

const httpsAgent = new https.Agent({ keepAlive: true })
const httpAgent = new http.Agent({ keepAlive: true })

export const generateCKB = (url: string): CKB => {
  const ckb = new CKB(url)
  if (url.startsWith('https')) {
    ckb.rpc.setNode({ url, httpsAgent })
  } else {
    ckb.rpc.setNode({ url, httpAgent })
  }
  return ckb
}

export default {
  generateCKB
}

import CKB from '@nervosnetwork/ckb-sdk-core'
import https from 'https'
import http from 'http'

let httpsAgent: https.Agent
let httpAgent: http.Agent

const getHttpsAgent = () => {
  if (!httpsAgent) {
    httpsAgent = new https.Agent({ keepAlive: true })
  }
  return httpsAgent
}

const getHttpAgent = () => {
  if (!httpAgent) {
    httpAgent = new http.Agent({ keepAlive: true })
  }
  return httpAgent
}

export const generateCKB = (url: string): CKB => {
  const ckb = new CKB(url)
  if (url.startsWith('https')) {
    ckb.rpc.setNode({ url, httpsAgent: getHttpsAgent() })
  } else {
    ckb.rpc.setNode({ url, httpAgent: getHttpAgent() })
  }
  return ckb
}

export default {
  generateCKB
}

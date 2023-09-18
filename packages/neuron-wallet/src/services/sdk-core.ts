import { CKBRPC } from '@ckb-lumos/rpc'
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

export const generateCKB = (url: string): CKBRPC => {
  const rpc = new CKBRPC(url)
  if (url.startsWith('https')) {
    rpc.setNode({ url, httpsAgent: getHttpsAgent() })
  } else {
    rpc.setNode({ url, httpAgent: getHttpAgent() })
  }
  return rpc
}

export default {
  generateCKB,
}

import Core from '@nervosnetwork/ckb-sdk-core'
import https from 'https'
import http from 'http'

export const generateCore = (url: string): Core => {
  const core = new Core(url)
  if (url.startsWith('https')) {
    const httpsAgent = new https.Agent({ keepAlive: true })
    core.rpc.setNode({ url, httpsAgent })
  } else {
    const httpAgent = new http.Agent({ keepAlive: true })
    core.rpc.setNode({ url, httpAgent })
  }
  return core
}

export default {
  generateCore,
}

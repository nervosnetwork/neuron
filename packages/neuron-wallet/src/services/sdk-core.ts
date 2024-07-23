import { CKBRPC } from '@ckb-lumos/lumos/rpc'

export const generateCKB = (url: string): CKBRPC => {
  return new CKBRPC(url, { fetch: (request, init) => globalThis.fetch(request, { ...init, keepalive: true }) })
}

export default {
  generateCKB,
}

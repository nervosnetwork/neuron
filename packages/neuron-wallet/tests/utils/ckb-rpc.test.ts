import { NetworkType } from '../../src/models/network'
import { FullCKBRPC, generateRPC, LightRPC } from '../../src/utils/ckb-rpc'
import { BUNDLED_LIGHT_CKB_URL, BUNDLED_CKB_URL } from '../../src/utils/const'

describe('test ckb rpc file', () => {
  describe('test generateRPC', () => {
    it('url is light node', () => {
      const result = generateRPC(BUNDLED_LIGHT_CKB_URL, NetworkType.Light)
      expect(result instanceof LightRPC).toBeTruthy()
    })
    it('url is not light node', () => {
      const result = generateRPC(BUNDLED_CKB_URL, NetworkType.Default)
      expect(result instanceof FullCKBRPC).toBeTruthy()
    })
    it('url is https', () => {
      const result = generateRPC('https://localhost:8114', NetworkType.Default)
      expect(result.node.httpsAgent).toBeDefined()
    })
  })
})

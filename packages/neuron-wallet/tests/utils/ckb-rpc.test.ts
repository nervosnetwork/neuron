import { FullCKBRPC, generateRPC, LightRPC } from '../../src/utils/ckb-rpc'
import { BUNDLED_LIGHT_CKB_URL, BUNDLED_CKB_URL } from '../../src/utils/const'

describe('test ckb rpc file', () => {
  describe('test generateRPC', () => {
    it('url is light node', () => {
      const result = generateRPC(BUNDLED_LIGHT_CKB_URL)
      expect(result instanceof LightRPC).toBeTruthy()
    })
    it('url is not light node', () => {
      const result = generateRPC(BUNDLED_CKB_URL)
      expect(result instanceof FullCKBRPC).toBeTruthy()
    })
    it('url is https', () => {
      const result = generateRPC('https://localhost:8114')
      expect(result.node.httpsAgent).toBeDefined()
    })
  })
})

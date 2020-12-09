import Script, { ScriptHashType } from "../../src/models/chain/script"
import AddressGenerator from "../../src/models/address-generator"
import { AddressPrefix } from '../../src/models/keys/address'
import SystemScriptInfo from '../../src/models/system-script-info'
import AssetAccountInfo from "../../src/models/asset-account-info"

describe('AddressGenerator', () => {
  const shortAddressInfo = {
    testnetAddress: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    mainnetAddress: 'ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd',
    lock: SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c')
  }

  const multiSignAddressInfo = {
    mainnetAddress: 'ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg',
    testnetAddress: 'ckt1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqt6f5y5',
    lock: SystemScriptInfo.generateMultiSignScript('0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a')
  }

  const assetAccountInfo = new AssetAccountInfo()
  const shortACPAddressInfo = {
    mainnetAddress: 'ckb1qypylv479ewscx3ms620sv34pgeuz6zagaaqvrugu7',
    testnetAddress: 'ckt1qypylv479ewscx3ms620sv34pgeuz6zagaaq3xzhsz',
    lock: assetAccountInfo.generateAnyoneCanPayScript('0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a')
  }

  const fullAddressInfo = {
    mainnetAddress: 'ckb1qsqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqprvumhs9nvu786dj9p0q5elx66t24n3kxgr8j38l',
    testnetAddress: 'ckt1qsqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqprvumhs9nvu786dj9p0q5elx66t24n3kxgwytuqq',
    lock: new Script('0x0000000000000000000000000000000000000000000000000000000000000011', '0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64', ScriptHashType.Type)
  }

  const fullAddressWithData = {
    mainnetAddress: 'ckb1q2da0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsdkr98kkxrtvuag8z2j8w4pkw2k6k4l5c7jxc4f',
    testnetAddress: 'ckt1q2da0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsdkr98kkxrtvuag8z2j8w4pkw2k6k4l5cn3l4jk',
    lock: new Script(SystemScriptInfo.SECP_CODE_HASH, '0x36c329ed630d6ce750712a477543672adab57f4c', ScriptHashType.Data)
  }

  describe('toShort', () => {
    it('mainnet', () => {
      const result = AddressGenerator.toShort(shortAddressInfo.lock, AddressPrefix.Mainnet)

      expect(result).toEqual(shortAddressInfo.mainnetAddress)
    })

    it('testnet', () => {
      const result = AddressGenerator.toShort(shortAddressInfo.lock, AddressPrefix.Testnet)

      expect(result).toEqual(shortAddressInfo.testnetAddress)
    })

    it('throw error', () => {
      expect(() => {
        AddressGenerator.toShort(fullAddressWithData.lock)
      }).toThrowError()
    })
  })

  describe("generate", () => {
    it('full payload, mainnet', () => {
      const result = AddressGenerator.generate(fullAddressInfo.lock, AddressPrefix.Mainnet)

      expect(result).toEqual(fullAddressInfo.mainnetAddress)
    })

    it('full payload, testnet', () => {
      const result = AddressGenerator.generate(fullAddressInfo.lock, AddressPrefix.Testnet)

      expect(result).toEqual(fullAddressInfo.testnetAddress)
    })

    it('short default lock payload, mainnet', () => {
      const result = AddressGenerator.generate(shortAddressInfo.lock, AddressPrefix.Mainnet)

      expect(result).toEqual(shortAddressInfo.mainnetAddress)
    })

    it('short default lock payload, testnet', () => {
      const result = AddressGenerator.generate(shortAddressInfo.lock, AddressPrefix.Testnet)

      expect(result).toEqual(shortAddressInfo.testnetAddress)
    })

    it('short acp lock payload, mainnet', () => {
      const result = AddressGenerator.generate(shortACPAddressInfo.lock, AddressPrefix.Mainnet)

      expect(result).toEqual(shortACPAddressInfo.mainnetAddress)
    })

    it('short acp lock payload, testnet', () => {
      const result = AddressGenerator.generate(shortACPAddressInfo.lock, AddressPrefix.Testnet)

      expect(result).toEqual(shortACPAddressInfo.testnetAddress)
    })

    it('short multi payload, mainnet', () => {
      const result = AddressGenerator.generate(multiSignAddressInfo.lock, AddressPrefix.Mainnet)

      expect(result).toEqual(multiSignAddressInfo.mainnetAddress)
    })

    it('short multi payload, testnet', () => {
      const result = AddressGenerator.generate(multiSignAddressInfo.lock, AddressPrefix.Testnet)

      expect(result).toEqual(multiSignAddressInfo.testnetAddress)
    })

    it('full payload, with data hash type, mainnet', () => {
      const result = AddressGenerator.generate(fullAddressWithData.lock, AddressPrefix.Mainnet)

      expect(result).toEqual(fullAddressWithData.mainnetAddress)
    })

    it('full payload, with data hash type, testnet', () => {
      const result = AddressGenerator.generate(fullAddressWithData.lock, AddressPrefix.Testnet)

      expect(result).toEqual(fullAddressWithData.testnetAddress)
    })
  })
})

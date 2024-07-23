import { scriptToAddress } from '../../../src/utils/scriptAndAddress'
import { hd } from '@ckb-lumos/lumos'
import KeyInfos from '../../setupAndTeardown/public-key-info.fixture'
import { systemScripts } from '../../../src/utils/systemScripts'
import { NetworkType } from '../../../src/models/network'

const stubbedIsMainnet = jest.fn()

jest.mock('services/networks', () => {
  return {
    getInstance: () => ({
      isMainnet: stubbedIsMainnet,
      getCurrent: () => ({
        type: NetworkType.Normal,
      }),
    }),
  }
})

const HdPublicKeyInfoModel = require('../../../src/models/keys/hd-public-key-info').default

const resetMocks = () => {
  stubbedIsMainnet.mockReset()
}

describe('HdPublicKeyInfoModel', () => {
  const [keyInfo] = KeyInfos
  let keyInfoModel: any

  beforeEach(() => {
    resetMocks()
  })

  describe('#address', () => {
    describe('with mainnet', () => {
      beforeEach(() => {
        stubbedIsMainnet.mockReturnValue(true)
        keyInfoModel = HdPublicKeyInfoModel.fromObject({
          publicKeyInBlake160: keyInfo.publicKeyInBlake160,
        })
      })
      it('generates mainnet address by property', () => {
        const address = scriptToAddress(
          {
            codeHash: systemScripts.SECP256K1_BLAKE160.CODE_HASH,
            hashType: systemScripts.SECP256K1_BLAKE160.HASH_TYPE,
            args: keyInfo.publicKeyInBlake160,
          },
          true
        )
        expect(keyInfoModel.address).toEqual(address)
      })
    })
    describe('with testnet', () => {
      beforeEach(() => {
        stubbedIsMainnet.mockReturnValue(false)
        keyInfoModel = HdPublicKeyInfoModel.fromObject({
          publicKeyInBlake160: keyInfo.publicKeyInBlake160,
        })
      })
      it('generates testnet address by property', () => {
        const address = scriptToAddress(
          {
            codeHash: systemScripts.SECP256K1_BLAKE160.CODE_HASH,
            hashType: systemScripts.SECP256K1_BLAKE160.HASH_TYPE,
            args: keyInfo.publicKeyInBlake160,
          },
          false
        )
        expect(keyInfoModel.address).toEqual(address)
      })
    })
  })

  describe('#path', () => {
    describe('with change address type', () => {
      beforeEach(() => {
        keyInfoModel = HdPublicKeyInfoModel.fromObject({
          addressType: hd.AddressType.Change,
          addressIndex: 1,
        })
      })
      it('generates path by property', () => {
        expect(keyInfoModel.path).toEqual("m/44'/309'/0'/1/1")
      })
    })
    describe('with receive address type', () => {
      beforeEach(() => {
        keyInfoModel = HdPublicKeyInfoModel.fromObject({
          addressType: hd.AddressType.Receiving,
          addressIndex: 1,
        })
      })
      it('generates path by property', () => {
        expect(keyInfoModel.path).toEqual("m/44'/309'/0'/0/1")
      })
    })
  })
})

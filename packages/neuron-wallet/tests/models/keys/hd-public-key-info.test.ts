import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import AddressGenerator from '../../../src/models/address-generator'
import { AddressType } from '../../../src/models/keys/address'
import KeyInfos from '../../setupAndTeardown/public-key-info.fixture'

const stubbedIsMainnet = jest.fn()

jest.doMock('services/networks', () => {
  return {
    getInstance: () => ({
      isMainnet: stubbedIsMainnet
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
  });

  describe('#address', () => {
    describe('with mainnet', () => {
      beforeEach(() => {
        stubbedIsMainnet.mockReturnValue(true)
        keyInfoModel = HdPublicKeyInfoModel.fromObject({
          publicKeyInBlake160: keyInfo.publicKeyInBlake160,
        })
      });
      it('generates mainnet address by property', () => {
        const address = AddressGenerator.toShortByBlake160(keyInfo.publicKeyInBlake160, AddressPrefix.Mainnet)
        expect(keyInfoModel.address).toEqual(address)
      })
    });
    describe('with testnet', () => {
      beforeEach(() => {
        stubbedIsMainnet.mockReturnValue(false)
        keyInfoModel = HdPublicKeyInfoModel.fromObject({
          publicKeyInBlake160: keyInfo.publicKeyInBlake160,
        })
      });
      it('generates testnet address by property', () => {
        const address = AddressGenerator.toShortByBlake160(keyInfo.publicKeyInBlake160, AddressPrefix.Testnet)
        expect(keyInfoModel.address).toEqual(address)
      })
    });
  });

  describe('#path', () => {
    describe('with change address type', () => {
      beforeEach(() => {
        keyInfoModel = HdPublicKeyInfoModel.fromObject({
          addressType: AddressType.Change,
          addressIndex: 1
        })
      });
      it('generates path by property', () => {
        expect(keyInfoModel.path).toEqual("m/44'/309'/0'/1/1")
      })
    });
    describe('with receive address type', () => {
      beforeEach(() => {
        keyInfoModel = HdPublicKeyInfoModel.fromObject({
          addressType: AddressType.Receiving,
          addressIndex: 1
        })
      });
      it('generates path by property', () => {
        expect(keyInfoModel.path).toEqual("m/44'/309'/0'/0/1")
      })
    });
  });
});

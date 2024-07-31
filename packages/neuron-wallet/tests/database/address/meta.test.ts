import { Address, AddressVersion } from '../../../src/models/address'
import { hd } from '@ckb-lumos/lumos'
import AddressMeta from '../../../src/database/address/meta'
import Multisig from '../../../src/models/multisig'
import AssetAccountInfo from '../../../src/models/asset-account-info'

describe('Address Dao tests', () => {
  const address: Address = {
    walletId: '1',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    path: "m/44'/309'/0'/0/0",
    addressType: hd.AddressType.Receiving,
    addressIndex: 0,
    txCount: 0,
    liveBalance: '0',
    sentBalance: '0',
    pendingBalance: '0',
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
    version: AddressVersion.Testnet,
  }

  it('#fromObject', () => {
    const addressMeta = AddressMeta.fromObject(address)
    expect(addressMeta).toEqual(address)
  })

  describe('generates scripts', () => {
    let addressMeta: AddressMeta
    beforeEach(() => {
      addressMeta = AddressMeta.fromObject(address)
    })

    it('#generateDefaultLockScript', () => {
      const script = addressMeta.generateDefaultLockScript()
      expect(script).toEqual({
        args: address.blake160,
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type',
      })
    })

    it('#generateSingleMultiSignLockScript', () => {
      const script = addressMeta.generateSingleMultiSignLockScript()
      expect(script).toEqual({
        args: Multisig.hash([address.blake160]),
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type',
      })
    })

    it('#generateACPLockScript', () => {
      const script = addressMeta.generateACPLockScript()
      const assetAccountInfo = new AssetAccountInfo()
      expect(script).toEqual({
        args: address.blake160,
        codeHash: assetAccountInfo.anyoneCanPayCodeHash,
        hashType: 'type',
      })
    })
  })
})

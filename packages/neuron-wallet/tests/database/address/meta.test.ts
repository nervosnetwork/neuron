import { AddressVersion, Address } from '../../../src/database/address/address-dao'
import { AddressType } from '../../../src/models/keys/address'
import AddressMeta from '../../../src/database/address/meta'

describe('Address Dao tests', () => {
  const address: Address = {
    walletId: '1',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    path: "m/44'/309'/0'/0/0",
    addressType: AddressType.Receiving,
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
    });

    it('#generateDefaultLockScript', () => {
      const script = addressMeta.generateDefaultLockScript()
      expect(script).toEqual({
        args: '0x36c329ed630d6ce750712a477543672adab57f4c',
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type'
      })
    })

    it('#generateSingleMultiSignLockScript', () => {
      const script = addressMeta.generateSingleMultiSignLockScript()
      expect(script).toEqual({
        args: '0x36c329ed630d6ce750712a477543672adab57f4c',
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type'
      })
    })

    it('#generateACPLockScript', () => {
      const script = addressMeta.generateACPLockScript()
      expect(script).toEqual({
        args: '0x36c329ed630d6ce750712a477543672adab57f4c',
        codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        hashType: 'type'
      })
    })
  });

})

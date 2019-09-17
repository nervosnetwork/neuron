import Address, { AddressType, publicKeyToAddress, AddressPrefix } from '../../../src/models/keys/address'

describe('address', () => {
  it('path from index', () => {
    expect(Address.pathFor(AddressType.Receiving, 0)).toEqual(`m/44'/309'/0'/0/0`)
    expect(Address.pathFor(AddressType.Receiving, 1)).toEqual(`m/44'/309'/0'/0/1`)
    expect(Address.pathFor(AddressType.Change, 0)).toEqual(`m/44'/309'/0'/1/0`)
    expect(Address.pathFor(AddressType.Change, 1)).toEqual(`m/44'/309'/0'/1/1`)

    expect(Address.pathForReceiving(0)).toEqual(`m/44'/309'/0'/0/0`)
    expect(Address.pathForReceiving(1)).toEqual(`m/44'/309'/0'/0/1`)
    expect(Address.pathForChange(0)).toEqual(`m/44'/309'/0'/1/0`)
    expect(Address.pathForChange(1)).toEqual(`m/44'/309'/0'/1/1`)
  })

  it('from public key', () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const path = `m/44'/309'/0'/0/0`
    const address = Address.fromPublicKey(publicKey, `m/44'/309'/0'/0/0`)
    expect(address.address).toEqual('ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83')
    expect(address.path).toEqual(path)
  })

  it('Generate testnet address from public key', () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = publicKeyToAddress(publicKey)
    expect(address).toEqual('ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83')
  })

  it('Generate mainnet address from public key', () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = publicKeyToAddress(publicKey, AddressPrefix.Mainnet)
    expect(address).toEqual('ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd')
  })
})

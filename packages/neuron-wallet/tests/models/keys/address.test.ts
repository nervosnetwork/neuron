import Address, { AddressType, publicKeyToAddress } from '../../../src/models/keys/address'

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
    expect(address.address).toEqual(
      'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqfkcv576ccddnn4quf2ga65xee2m26h7nq4sds0r'
    )
    expect(address.path).toEqual(path)
  })

  it('Generate testnet address from public key', () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = publicKeyToAddress(publicKey)
    expect(address).toEqual(
      'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqfkcv576ccddnn4quf2ga65xee2m26h7nq4sds0r'
    )
  })

  it('Generate mainnet address from public key', () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = publicKeyToAddress(publicKey, true)
    expect(address).toEqual(
      'ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqfkcv576ccddnn4quf2ga65xee2m26h7nqmzxl9m'
    )
  })
})

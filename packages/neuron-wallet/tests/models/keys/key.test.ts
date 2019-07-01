import {
  ExtendedPublicKey,
  AccountExtendedPublicKey,
  ExtendedPrivateKey,
  generateMnemonic,
} from '../../../src/models/keys/key'
import { AddressType } from '../../../src/models/keys/address'

const fixture = {
  privateKey: 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
  publicKey: '0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
  chainCode: '873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508',
}

describe('extended public key', () => {
  it('serialize and parse', () => {
    const extendedKey = new ExtendedPublicKey(fixture.publicKey, fixture.chainCode)
    const serialized = extendedKey.serialize()
    const parsed = ExtendedPublicKey.parse(serialized)
    expect(parsed.publicKey).toEqual(fixture.publicKey)
    expect(parsed.chainCode).toEqual(fixture.chainCode)
  })
})

describe('account extended public key', () => {
  const extendedKey = new AccountExtendedPublicKey(
    '03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3',
    '37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
  )

  it('key from extended public key', () => {
    // @ts-ignore: Private method
    expect(extendedKey.addressPublicKey(AddressType.Receiving, 0)).toEqual(
      '0331b3c0225388c5010e3507beb28ecf409c022ef6f358f02b139cbae082f5a2a3'
    )
    // @ts-ignore: Private method
    expect(extendedKey.addressPublicKey(AddressType.Change, 1)).toEqual(
      '0360bf05c11e7b4ac8de58077554e3d777acd64bf4abb9cd947002eb98a4827bba'
    )
  })

  it('serialize and parse', () => {
    const serialized = extendedKey.serialize()
    const parsed = AccountExtendedPublicKey.parse(serialized)
    expect(parsed.publicKey).toEqual(extendedKey.publicKey)
    expect(parsed.chainCode).toEqual(extendedKey.chainCode)
  })

  it('derive address', () => {
    const receivingAddress = extendedKey.address(AddressType.Receiving, 0)
    expect(receivingAddress.path).toEqual(`m/44'/309'/0'/0/0`)

    const changeAddress = extendedKey.address(AddressType.Change, 1)
    expect(changeAddress.path).toEqual(`m/44'/309'/0'/1/1`)
  })
})

describe('extended private key', () => {
  it('serialize and parse', () => {
    const extendedKey = new ExtendedPrivateKey(fixture.privateKey, fixture.chainCode)
    const serialized = extendedKey.serialize()
    const parsed = ExtendedPrivateKey.parse(serialized)
    expect(parsed.privateKey).toEqual(fixture.privateKey)
    expect(parsed.chainCode).toEqual(fixture.chainCode)
  })

  it('derivate extended public key', () => {
    const extendedKey = new ExtendedPrivateKey(fixture.privateKey, fixture.chainCode).toExtendedPublicKey()
    expect(extendedKey.publicKey).toEqual(fixture.publicKey)
    expect(extendedKey.chainCode).toEqual(fixture.chainCode)
  })
})

describe('generate mnemonic', () => {
  it('generate 12 words code', () => {
    const mnemonic = generateMnemonic()
    expect(mnemonic.split(' ').length).toBe(12)
  })
})

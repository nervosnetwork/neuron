import { ExtendedPublicKey, ExtendedPrivateKey, generateMnemonic } from '../../src/keys/key'

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

import { Keychain } from '../../src/keys/hd'

describe('BIP32 Keychain tests', () => {
  it('create master keychain', () => {
    const master = Keychain.fromSeed(Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex'))
    expect(master.identifier.toString('hex')).toEqual('3442193e1bb70916e914552172cd4e2dbc9df811')
    expect(master.fingerprint).toEqual(876747070)
    expect(master.privateKey.toString('hex')).toBe('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35')
  })
})

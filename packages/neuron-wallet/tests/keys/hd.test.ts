import { Keychain } from '../../src/keys/hd'

// https://en.bitcoin.it/wiki/BIP_0032_TestVectors
describe('BIP32 Keychain tests', () => {
  it('create master keychain from seed', () => {
    const master = Keychain.fromSeed(Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex'))
    expect(master.identifier.toString('hex')).toEqual('3442193e1bb70916e914552172cd4e2dbc9df811')
    expect(master.fingerprint).toEqual(876747070)
    expect(master.privateKey.toString('hex')).toEqual(
      'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
    )
    expect(master.chainCode.toString('hex')).toEqual('873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508')
    expect(master.index).toEqual(0)
    expect(master.depth).toEqual(0)
    expect(master.parentFingerprint).toEqual(0)
  })

  it('create master keychain from long seed', () => {
    const master = Keychain.fromSeed(
      Buffer.from(
        'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
        'hex',
      ),
    )
    expect(master.identifier.toString('hex')).toEqual('bd16bee53961a47d6ad888e29545434a89bdfe95')
    expect(master.fingerprint).toEqual(3172384485)
    expect(master.privateKey.toString('hex')).toEqual(
      '4b03d6fc340455b363f51020ad3ecca4f0850280cf436c70c727923f6db46c3e',
    )
    expect(master.chainCode.toString('hex')).toEqual('60499f801b896d83179a4374aeb7822aaeaceaa0db1f85ee3e904c4defbd9689')
    expect(master.index).toEqual(0)
    expect(master.depth).toEqual(0)
    expect(master.parentFingerprint).toEqual(0)
  })
})

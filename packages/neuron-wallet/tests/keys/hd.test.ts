import { Keychain } from '../../src/keys/hd'

// https://en.bitcoin.it/wiki/BIP_0032_TestVectors
describe('BIP32 Keychain tests', () => {
  const shortSeed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
  const longSeed = Buffer.from(
    'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
    'hex',
  )

  it('create master keychain from seed', () => {
    const master = Keychain.fromSeed(shortSeed)
    expect(master.privateKey.toString('hex')).toEqual(
      'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
    )
    expect(master.identifier.toString('hex')).toEqual('3442193e1bb70916e914552172cd4e2dbc9df811')
    expect(master.fingerprint).toEqual(876747070)
    expect(master.chainCode.toString('hex')).toEqual('873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508')
    expect(master.index).toEqual(0)
    expect(master.depth).toEqual(0)
    expect(master.parentFingerprint).toEqual(0)
  })

  it('derive children hardened', () => {
    const master = Keychain.fromSeed(shortSeed)
    const child = master.deriveChild(0, true)
    expect(child.privateKey.toString('hex')).toEqual('edb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea')
    expect(child.identifier.toString('hex')).toEqual('5c1bd648ed23aa5fd50ba52b2457c11e9e80a6a7')
    expect(child.fingerprint).toEqual(1545328200)
    expect(child.chainCode.toString('hex')).toEqual('47fdacbd0f1097043b78c63c20c34ef4ed9a111d980047ad16282c7ae6236141')
    expect(child.index).toEqual(0)
    expect(child.depth).toEqual(1)
  })

  it('derive path', () => {
    const master = Keychain.fromSeed(shortSeed)
    expect(master.derivePath(`m/0'`).privateKey.toString('hex')).toEqual(
      'edb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea',
    )

    const child = master.derivePath(`m/0'/1/2'`)
    expect(child.privateKey.toString('hex')).toEqual('cbce0d719ecf7431d88e6a89fa1483e02e35092af60c042b1df2ff59fa424dca')
    expect(child.identifier.toString('hex')).toEqual('ee7ab90cde56a8c0e2bb086ac49748b8db9dce72')
    expect(child.fingerprint).toEqual(4001020172)
    expect(child.chainCode.toString('hex')).toEqual('04466b9cc8e161e966409ca52986c584f07e9dc81f735db683c3ff6ec7b1503f')
    expect(child.index).toEqual(2)
    expect(child.depth).toEqual(3)
  })

  it('create master keychain from long seed', () => {
    const master = Keychain.fromSeed(longSeed)
    expect(master.privateKey.toString('hex')).toEqual(
      '4b03d6fc340455b363f51020ad3ecca4f0850280cf436c70c727923f6db46c3e',
    )
    expect(master.identifier.toString('hex')).toEqual('bd16bee53961a47d6ad888e29545434a89bdfe95')
    expect(master.fingerprint).toEqual(3172384485)
    expect(master.chainCode.toString('hex')).toEqual('60499f801b896d83179a4374aeb7822aaeaceaa0db1f85ee3e904c4defbd9689')
    expect(master.index).toEqual(0)
    expect(master.depth).toEqual(0)
    expect(master.parentFingerprint).toEqual(0)
  })

  it('derive children no hardened', () => {
    const master = Keychain.fromSeed(longSeed)
    const child = master.deriveChild(0, false)
    expect(child.privateKey.toString('hex')).toEqual('abe74a98f6c7eabee0428f53798f0ab8aa1bd37873999041703c742f15ac7e1e')
    expect(child.identifier.toString('hex')).toEqual('5a61ff8eb7aaca3010db97ebda76121610b78096')
    expect(child.fingerprint).toEqual(1516371854)
    expect(child.chainCode.toString('hex')).toEqual('f0909affaa7ee7abe5dd4e100598d4dc53cd709d5a5c2cac40e7412f232f7c9c')
    expect(child.index).toEqual(0)
    expect(child.depth).toEqual(1)
  })
})

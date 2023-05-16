import Keychain, { privateToPublic } from '../../../src/models/keys/keychain'

// https://en.bitcoin.it/wiki/BIP_0032_TestVectors
describe('BIP32 Keychain tests', () => {
  const shortSeed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
  const longSeed = Buffer.from(
    'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
    'hex'
  )

  it('create master keychain from seed', () => {
    const master = Keychain.fromSeed(shortSeed)
    expect(master.privateKey.toString('hex')).toEqual(
      'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35'
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
      'edb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea'
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
      '4b03d6fc340455b363f51020ad3ecca4f0850280cf436c70c727923f6db46c3e'
    )
    expect(master.identifier.toString('hex')).toEqual('bd16bee53961a47d6ad888e29545434a89bdfe95')
    expect(master.fingerprint).toEqual(3172384485)
    expect(master.chainCode.toString('hex')).toEqual('60499f801b896d83179a4374aeb7822aaeaceaa0db1f85ee3e904c4defbd9689')
    expect(master.index).toEqual(0)
    expect(master.depth).toEqual(0)
    expect(master.parentFingerprint).toEqual(0)
  })

  it('derive path large index', () => {
    const master = Keychain.fromSeed(longSeed)
    expect(master.derivePath(`m`).privateKey.toString('hex')).toEqual(
      '4b03d6fc340455b363f51020ad3ecca4f0850280cf436c70c727923f6db46c3e'
    )

    let child = master.derivePath(`0/2147483647'`)
    expect(child.privateKey.toString('hex')).toEqual('877c779ad9687164e9c2f4f0f4ff0340814392330693ce95a58fe18fd52e6e93')
    expect(child.identifier.toString('hex')).toEqual('d8ab493736da02f11ed682f88339e720fb0379d1')
    expect(child.fingerprint).toEqual(3635104055)
    expect(child.chainCode.toString('hex')).toEqual('be17a268474a6bb9c61e1d720cf6215e2a88c5406c4aee7b38547f585c9a37d9')
    expect(child.index).toEqual(2147483647)
    expect(child.depth).toEqual(2)

    child = child.deriveChild(1, false)
    expect(child.privateKey.toString('hex')).toEqual('704addf544a06e5ee4bea37098463c23613da32020d604506da8c0518e1da4b7')
    expect(child.identifier.toString('hex')).toEqual('78412e3a2296a40de124307b6485bd19833e2e34')
    expect(child.fingerprint).toEqual(2017537594)
    expect(child.chainCode.toString('hex')).toEqual('f366f48f1ea9f2d1d3fe958c95ca84ea18e4c4ddb9366c336c927eb246fb38cb')
    expect(child.index).toEqual(1)
    expect(child.depth).toEqual(3)

    child = child.deriveChild(2147483646, true)
    expect(child.privateKey.toString('hex')).toEqual('f1c7c871a54a804afe328b4c83a1c33b8e5ff48f5087273f04efa83b247d6a2d')
    expect(child.identifier.toString('hex')).toEqual('31a507b815593dfc51ffc7245ae7e5aee304246e')
    expect(child.fingerprint).toEqual(832899000)
    expect(child.chainCode.toString('hex')).toEqual('637807030d55d01f9a0cb3a7839515d796bd07706386a6eddf06cc29a65a0e29')
    expect(child.index).toEqual(2147483646)
    expect(child.depth).toEqual(4)
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

  it('create child keychain from public key', () => {
    const child = Keychain.fromPublicKey(
      Buffer.from('0357bfe1e341d01c69fe5654309956cbea516822fba8a601743a012a7896ee8dc2', 'hex'),
      Buffer.from('04466b9cc8e161e966409ca52986c584f07e9dc81f735db683c3ff6ec7b1503f', 'hex'),
      `m/0'/1/2'`
    )
    expect(child.identifier.toString('hex')).toEqual('ee7ab90cde56a8c0e2bb086ac49748b8db9dce72')
    expect(child.fingerprint).toEqual(4001020172)
    expect(child.index).toEqual(2)
    expect(child.depth).toEqual(3)

    const grandchild = child.deriveChild(2, false)
    expect(grandchild.publicKey.toString('hex')).toEqual(
      '02e8445082a72f29b75ca48748a914df60622a609cacfce8ed0e35804560741d29'
    )
    expect(grandchild.chainCode.toString('hex')).toEqual(
      'cfb71883f01676f587d023cc53a35bc7f88f724b1f8c2892ac1275ac822a3edd'
    )
    expect(grandchild.identifier.toString('hex')).toEqual('d880d7d893848509a62d8fb74e32148dac68412f')
    expect(grandchild.fingerprint).toEqual(3632322520)
    expect(grandchild.index).toEqual(2)
    expect(grandchild.depth).toEqual(4)
  })

  it('derive ckb keys', () => {
    const master = Keychain.fromSeed(shortSeed)
    const extendedKey = master.derivePath(`m/44'/309'/0'`)
    expect(extendedKey.privateKey.toString('hex')).toEqual(
      'bb39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016'
    )
    expect(extendedKey.publicKey.toString('hex')).toEqual(
      '03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3'
    )
    expect(extendedKey.chainCode.toString('hex')).toEqual(
      '37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
    )

    const addressKey = extendedKey.deriveChild(0, false).deriveChild(0, false)
    expect(addressKey.privateKey.toString('hex')).toEqual(
      'fcba4708f1f07ddc00fc77422d7a70c72b3456f5fef3b2f68368cdee4e6fb498'
    )
    expect(addressKey.publicKey.toString('hex')).toEqual(
      '0331b3c0225388c5010e3507beb28ecf409c022ef6f358f02b139cbae082f5a2a3'
    )
    expect(addressKey.chainCode.toString('hex')).toEqual(
      'c4b7aef857b625bbb0497267ed51151d090f81737f4f22a0ac3673483b927090'
    )
  })

  it('derive ckb keys another seed', () => {
    const master = Keychain.fromSeed(
      // From mnemonic `tank planet champion pottery together intact quick police asset flower sudden question`
      Buffer.from(
        '1371018cfad5990f5e451bf586d59c3820a8671162d8700533549b0df61a63330e5cd5099a5d3938f833d51e4572104868bfac7cfe5b4063b1509a995652bc08',
        'hex'
      )
    )
    expect(master.privateKey.toString('hex')).toEqual(
      '37d25afe073a6ba17badc2df8e91fc0de59ed88bcad6b9a0c2210f325fafca61'
    )

    expect(master.derivePath(`m/44'/309'/0'`).privateKey.toString('hex')).toEqual(
      '2925f5dfcbee3b6ad29100a37ed36cbe92d51069779cc96164182c779c5dc20e'
    )

    expect(master.derivePath(`m/44'/309'/0'`).deriveChild(0, false).privateKey.toString('hex')).toEqual(
      '047fae4f38b3204f93a6b39d6dbcfbf5901f2b09f6afec21cbef6033d01801f1'
    )

    expect(master.derivePath(`m/44'/309'/0'/0`).privateKey.toString('hex')).toEqual(
      '047fae4f38b3204f93a6b39d6dbcfbf5901f2b09f6afec21cbef6033d01801f1'
    )

    expect(
      master.derivePath(`m/44'/309'/0'`).deriveChild(0, false).deriveChild(0, false).privateKey.toString('hex')
    ).toEqual('848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14')

    expect(master.derivePath(`m/44'/309'/0'/0/0`).privateKey.toString('hex')).toEqual(
      '848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14'
    )
  })

  it('derive ckb keys from master extended key', () => {
    const privateKey = Buffer.from('37d25afe073a6ba17badc2df8e91fc0de59ed88bcad6b9a0c2210f325fafca61', 'hex')
    const chainCode = Buffer.from('5f772d1e3cfee5821911aefa5e8f79d20d4cf6678378d744efd08b66b2633b80', 'hex')
    const master = new Keychain(privateKey, chainCode)
    expect(master.publicKey.toString('hex')).toEqual(
      '020720a7a11a9ac4f0330e2b9537f594388ea4f1cd660301f40b5a70e0bc231065'
    )

    expect(master.derivePath(`m/44'/309'/0'`).privateKey.toString('hex')).toEqual(
      '2925f5dfcbee3b6ad29100a37ed36cbe92d51069779cc96164182c779c5dc20e'
    )

    expect(master.derivePath(`m/44'/309'/0'`).deriveChild(0, false).privateKey.toString('hex')).toEqual(
      '047fae4f38b3204f93a6b39d6dbcfbf5901f2b09f6afec21cbef6033d01801f1'
    )

    expect(master.derivePath(`m/44'/309'/0'/0`).privateKey.toString('hex')).toEqual(
      '047fae4f38b3204f93a6b39d6dbcfbf5901f2b09f6afec21cbef6033d01801f1'
    )

    expect(
      master.derivePath(`m/44'/309'/0'`).deriveChild(0, false).deriveChild(0, false).privateKey.toString('hex')
    ).toEqual('848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14')

    expect(master.derivePath(`m/44'/309'/0'/0/0`).privateKey.toString('hex')).toEqual(
      '848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14'
    )
  })

  it('private key add', () => {
    const privateKey = Buffer.from('9e919c96ac5a4caea7ba0ea1f7dd7bca5dca8a11e66ed633690c71e483a6e3c9', 'hex')
    const toAdd = Buffer.from('36e92e33659808bf06c3e4302b657f39ca285f6bb5393019bb4e2f7b96e3f914', 'hex')
    // @ts-ignore: Private method
    const sum = Keychain.privateKeyAdd(privateKey, toAdd)
    expect(sum.toString('hex')).toEqual('d57acaca11f2556dae7df2d22342fb0427f2e97d9ba8064d245aa1601a8adcdd')
  })

  it('public key add', () => {
    const publicKey = Buffer.from('03556b2c7e03b12845a973a6555b49fe44b0836fbf3587709fa73bb040ba181b21', 'hex')
    const toAdd = Buffer.from('953fd6b91b51605d32a28ab478f39ab53c90103b93bd688330b118c460e9c667', 'hex')
    // @ts-ignore: Private method
    const sum = Keychain.publicKeyAdd(publicKey, toAdd)
    expect(sum.toString('hex')).toEqual('03db6eab66f918e434bae0e24fd73de1a2b293a2af9bd3ad53123996fa94494f37')
  })
})

describe('private to public', () => {
  it('derive public key from private key', () => {
    const privateKey = Buffer.from('bb39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016', 'hex')
    const publicKey = Buffer.from('03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3', 'hex')
    expect(privateToPublic(privateKey)).toEqual(publicKey)
  })

  it('derive public key from private key wrong length', () => {
    expect(() => privateToPublic(Buffer.from(''))).toThrowError()
    expect(() =>
      privateToPublic(Buffer.from('39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016', 'hex'))
    ).toThrowError()
    expect(() =>
      privateToPublic(Buffer.from('0xbb39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016', 'hex'))
    ).toThrowError()
  })
})

import { ExtendedPrivateKey } from '../../../src/models/keys/key'
import Keystore from '../../../src/models/keys/keystore'
import { IncorrectPassword } from '../../../src/exceptions/wallet'

const fixture = {
  privateKey: 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
  publicKey: '0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
  chainCode: '873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508',
}

describe('load and check password', () => {
  const password = 'hello~!23'
  const keystore = Keystore.create(new ExtendedPrivateKey(fixture.privateKey, fixture.chainCode), password)

  it('checks wrong password', () => {
    expect(keystore.checkPassword(`oops${password}`)).toBe(false)
  })

  it('checks correct password', () => {
    expect(keystore.checkPassword(password)).toBe(true)
  })

  it('decrypts', () => {
    expect(keystore.decrypt(password)).toEqual(
      new ExtendedPrivateKey(fixture.privateKey, fixture.chainCode).serialize()
    )
  })

  it('loads private key', () => {
    const extendedPrivateKey = keystore.extendedPrivateKey(password)
    expect(extendedPrivateKey.privateKey).toEqual(fixture.privateKey)
    expect(extendedPrivateKey.chainCode).toEqual(fixture.chainCode)
  })
})

describe('load ckb cli light keystore', () => {
  const password = '123'
  const keystoreString =
    '{"crypto":{"cipher": "aes-128-ctr", "ciphertext": "253397209cae86474e368720f9baa30f448767047d2cc5a7672ef121861974ed", "cipherparams": {"iv": "8bd8523e0048db3a4ae2534aec6d303a"}, "kdf": "scrypt", "kdfparams": {"dklen": 32, "n": 4096, "p": 6, "r": 8, "salt": "be3d86c99f4895f99d1a0048afb61a34153fa83d5edd033fc914de2c502f57e7"}, "mac": "4453cf5d4f6ec43d0664c3895c4ab9b1c9bcd2d02c7abb190c84375a42739099" },"id": "id", "version": 3}'
  const keystore = Keystore.fromJson(keystoreString)

  it('checks correct password', () => {
    expect(keystore.checkPassword(password)).toBe(true)
  })
})

describe('load ckb cli standard keystore', () => {
  const password = '123'
  const keystoreString =
    '{"address":"ea22142fa5be326e834681144ca30326f99a6d5a","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"29304e5bcbb1885ef5cdcb40b5312b58"},"ciphertext":"93054530a8fbe5b11995acda856585d7362ac7d2b1e4f268c633d997be2d6532c4962501d0835bf52a4693ae7a091ac9bac9297793f4116ef7c123edb00dbc85","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"724327e67ca321ccf15035bb78a0a05c816bebbe218a0840abdc26da8453c1f4"},"mac":"1d0e5660ffbfc1f9ff4da97aefcfc2153c0ec1b411e35ffee26ee92815cc06f9"},"id":"43c1116e-efd5-4c9e-a86a-3ec0ab163122","version":3}'
  const keystore = Keystore.fromJson(keystoreString)

  it('checks correct password', () => {
    expect(keystore.checkPassword(password)).toBe(true)
  })

  it('loads private key', () => {
    const extendedPrivateKey = keystore.extendedPrivateKey(password)
    expect(extendedPrivateKey.privateKey).toEqual('8af124598932440269a81771ad662642e83a38b323b2f70223b8ae0b6c5e0779')
    expect(extendedPrivateKey.chainCode).toEqual('615302e2c93151a55c29121dd02ad554e47908a6df6d7374f357092cec11675b')
  })
})

describe('load ckb cli origin keystore', () => {
  const keystoreString =
    '{"origin":"ckb-cli", "address":"ea22142fa5be326e834681144ca30326f99a6d5a","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"29304e5bcbb1885ef5cdcb40b5312b58"},"ciphertext":"93054530a8fbe5b11995acda856585d7362ac7d2b1e4f268c633d997be2d6532c4962501d0835bf52a4693ae7a091ac9bac9297793f4116ef7c123edb00dbc85","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"724327e67ca321ccf15035bb78a0a05c816bebbe218a0840abdc26da8453c1f4"},"mac":"1d0e5660ffbfc1f9ff4da97aefcfc2153c0ec1b411e35ffee26ee92815cc06f9"},"id":"43c1116e-efd5-4c9e-a86a-3ec0ab163122","version":3}'

  it('does not load', () => {
    expect(
      () => Keystore.fromJson(keystoreString)
    ).toThrowError()
  })
})

describe("create empty keystore", () => {
  const keystore = Keystore.createEmpty()

  it("has empty cipertext and mac", () => {
    expect(keystore.crypto.ciphertext).toEqual("")
    expect(keystore.crypto.mac).toEqual("")
  })

  it("won't verify password", () => {
    expect(keystore.checkPassword("")).toBeFalsy()
    expect(keystore.checkPassword("anypassword")).toBeFalsy()
  })

  it("cannot decrypt", () => {
    expect(() => keystore.decrypt("")).toThrowError(new IncorrectPassword())
  })
})

import { ExtendedPrivateKey } from '../../../src/models/keys/key'
import Keystore from '../../../src/models/keys/keystore'

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
    '{"address":"02bf67769d8e12bd956550c71e7a4e344755afd9","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"4e530f7bc3b59909ce97d4e7baced7ad"},"ciphertext":"e26a1e4affd919c4c00a46920a44113a526d29aa4472d0d0f84e169841853b3f350a5d76f0de6c0a0a5bdd7b03495bb904b49c11d1e241090b77792480ba255d","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"37495d0caf3a816db294dc3f97ad8b4dd266820cccbabd7593356ff19be99e8d"},"mac":"5054f1fe0bf13cf6a1e3e4d7538eee451e263e61a935163a5b80a962849e6af3"},"id":"7f60eca5-3128-45e0-95be-08ee34c9ab37","version":3}'
  const keystore = Keystore.fromJson(keystoreString)

  it('checks correct password', () => {
    expect(keystore.checkPassword(password)).toBe(true)
  })
})

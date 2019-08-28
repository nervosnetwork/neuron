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
    '{"address":"c99d0619cc212febaf347eb265ae9517c9099ee0","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"aeaff7e3cecb7bb10fcc9b46a107f15e"},"ciphertext":"9d6aec2980833a6ee52bcdab4dd6f0945a838f66ef4e300e2b0bf32c56249bd8ce32007d47441ac4b8ea307c2a8a131b5f6c53690c1e51ff71b44ce73ab68d68","kdf":"scrypt","kdfparams":{"dklen":32,"n":4096,"p":6,"r":8,"salt":"9c6ab8596703e6934faaa1a48f41dbc96ee590dc7b1f3dc3c05139ef588dde6d"},"mac":"f2a3975897d4794b8b4e74ca5f1be09cd5069d90165ec3acf53bda11ac37338e"},"id":"af3de9c9-530e-4304-9db0-d4e5596cf2c6","version":3}'
  const keystore = Keystore.fromJson(keystoreString)

  it('checks correct password', () => {
    expect(keystore.checkPassword(password)).toBe(true)
  })
})

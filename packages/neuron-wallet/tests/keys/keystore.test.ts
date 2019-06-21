import { ExtendedPrivateKey } from '../../src/keys/key'
import Keystore from '../../src/keys/keystore'

const fixture = {
  privateKey: 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
  publicKey: '0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
  chainCode: '873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508',
}

/*
  const mnemonic = 'mechanic oppose oyster normal bunker trim step nasty birth naive panel soldier'
  const privateKey = '4e91f531d3351fd561506538ec0a68ba05d3d3444197e81d615ab76bbd200488'
  const keystoreJson =
    '{"version":3,"id":"e24843a9-ff71-4165-be2f-fc435f62635c","crypto":{"ciphertext":"c0f0e6c9a6f46e85a889bb26402d854b48ea81f3a9cbc5de2f9619523cd0bd1d486373cddd41b4d6f8e1f28bbfbefdb6e3db309c0d438e517bce19933181e6b9213a0315dfe336b9ae36b04dce611828ed5a9b65c084253974b834d99824722a910f324b35f899df013e429d11db65148bc0b5137f34c32b2c54e17e3df8023a","cipherparams":{"iv":"5ddddd8ab419b494da98de6b909abec2"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"78ee5048a3370ff776f03ebbcf7322ce6f6be6be8466206c045ea6146282cded","n":8192,"r":8,"p":1},"mac":"4f36d572648115b26cf0e9d1c219192d0411bea66092ca48bbf148f26057e649"}}'
    */

describe('load and check password', () => {
  const password = 'hello~!23'
  const keystore = Keystore.create(new ExtendedPrivateKey(fixture.privateKey, fixture.chainCode), password)

  it('checks wrong password', () => {
    expect(keystore.checkPassword(`oops${password}`)).toBe(false)
  })

  it('checks correct password', () => {
    expect(keystore.checkPassword(password)).toBe(true)
  })

  it('descrypt', () => {
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

import Key from '../src/keys/key'

describe('Key tests', () => {
  const mnemonic = 'mechanic oppose oyster normal bunker trim step nasty birth naive panel soldier'
  const privateKey = '4e91f531d3351fd561506538ec0a68ba05d3d3444197e81d615ab76bbd200488'
  const keystoreJson =
    '{"version":0,"id":"e24843a9-ff71-4165-be2f-fc435f62635c","crypto":{"ciphertext":"c671676b15e35107091318582186762c8ce11e7fc03cdd13efe7099985d94355a60477ddf2ff39b0054233cbcbefc297f1521094db1b473c095c9c3b9c143a0ad80c6806e14596bd438994a025ed76187350ae216d1b411f54f31c5beec989efdcb42ad673cda64d753dc876ed47da8cf65f4b45eded003b5a3a9a8f62dd69890bec62aaae6eeded75f650109f2d700db74515eaed5f3d401b59b02cd0518899","cipherparams":{"iv":"c210625979883ad1b6f90e7fb3f5b70d"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"54257d76bb23cbe83220f2bc267f98a69a3e1624d62e94f5bcbba9a8df34ec14","n":8192,"r":8,"p":1},"mac":"88b415ff1651bf94ce7fbc82a72a6fcd7e095cd763e8f726ef7bea4ccb028b00"}}'

  it('import key from mnemonic', async () => {
    const key = Key.fromMnemonic(mnemonic, '1qaz.2wsx', 17, 3)
    expect(privateKey).toBe(key.getPrivateKey())
    expect(key.getAddresses()!!.receive.length).toEqual(17)
    expect(key.getAddresses()!!.change.length).toEqual(3)
    expect(key.getAddresses()!!.receive[0]).not.toBe(undefined)
  })

  it('import key from keystore', async () => {
    const key = Key.fromKeystore(keystoreJson, '1qaz.2wsx', 17, 3)
    expect(privateKey).toBe(key.getPrivateKey())
    expect(key.getAddresses()!!.receive.length).toEqual(17)
    expect(key.getAddresses()!!.change.length).toEqual(3)
    expect(key.getAddresses()!!.receive[0]).not.toBe(undefined)
  })
})

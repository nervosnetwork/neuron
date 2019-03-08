import Key from '../src/keys/key'

describe('Key tests', () => {
  const mnemonic = 'mechanic oppose oyster normal bunker trim step nasty birth naive panel soldier'
  const keystoreJson =
    '{"master":{"privateKey":"4e91f531d3351fd561506538ec0a68ba05d3d3444197e81d615ab76bbd200488","chainCode":"769382d9761bef8ed409ce4f9d5aeae5b5260f6f60e50f791826c27ae7afc495"}}'

  it('import key from mnemonic without children', async () => {
    const key = Key.fromMnemonic(mnemonic, false)
    expect(key.getMnemonic()).toBe('mechanic oppose oyster normal bunker trim step nasty birth naive panel soldier')
    expect(key.getKeystoreJson()).toBe(keystoreJson)
    expect(key.getKeystore().master.privateKey).toBe('4e91f531d3351fd561506538ec0a68ba05d3d3444197e81d615ab76bbd200488')
    expect(key.getKeystore().master.chainCode).toBe('769382d9761bef8ed409ce4f9d5aeae5b5260f6f60e50f791826c27ae7afc495')
  })

  it('import key from keystore json without children', async () => {
    const key = Key.fromKeystoreJson(keystoreJson)
    expect(key.getKeystore().master.privateKey).toBe('4e91f531d3351fd561506538ec0a68ba05d3d3444197e81d615ab76bbd200488')
    expect(key.getKeystore().master.chainCode).toBe('769382d9761bef8ed409ce4f9d5aeae5b5260f6f60e50f791826c27ae7afc495')
  })

  it('generate key', async () => {
    const key = Key.generateKey()
    expect(key.getMnemonic()).not.toEqual(null)
    expect(key.getKeystore()).not.toEqual(null)
    expect(key.getKeystore().master).not.toEqual(null)
  })

  it('import key from mnemonic with children', async () => {
    const key = Key.fromMnemonic(mnemonic, true)
    expect(key.getKeystoreJson()).toBe('mechanic oppose oyster normal bunker trim step nasty birth naive panel soldier')
  })
})

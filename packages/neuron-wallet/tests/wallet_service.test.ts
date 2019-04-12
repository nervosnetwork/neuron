import assert from 'assert'
import WalletService from '../src/services/wallets'
import Key from '../src/keys/key'
import WalletStore from '../src/store/walletStore'

describe('test wallets controller', () => {
  const service = new WalletService()
  const walletStore = new WalletStore()
  const mnemonic = 'mechanic oppose oyster normal bunker trim step nasty birth naive panel soldier'
  const keystoreJson =
    '{"version":0,"id":"e24843a9-ff71-4165-be2f-fc435f62635c","crypto":{"ciphertext":"c671676b15e35107091318582186762c8ce11e7fc03cdd13efe7099985d94355a60477ddf2ff39b0054233cbcbefc297f1521094db1b473c095c9c3b9c143a0ad80c6806e14596bd438994a025ed76187350ae216d1b411f54f31c5beec989efdcb42ad673cda64d753dc876ed47da8cf65f4b45eded003b5a3a9a8f62dd69890bec62aaae6eeded75f650109f2d700db74515eaed5f3d401b59b02cd0518899","cipherparams":{"iv":"c210625979883ad1b6f90e7fb3f5b70d"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"54257d76bb23cbe83220f2bc267f98a69a3e1624d62e94f5bcbba9a8df34ec14","n":8192,"r":8,"p":1},"mac":"88b415ff1651bf94ce7fbc82a72a6fcd7e095cd763e8f726ef7bea4ccb028b00"}}'

  beforeEach(() => {
    walletStore.clearAll()
  })

  it('create wallet', () => {
    const key = Key.fromKeystore(keystoreJson, '1qaz.2wsx', 17, 3)
    const wallet = service.create({ name: '123', keystore: key.keystore!, addresses: key.addresses! })
    assert.deepEqual(walletStore.getAllWallets().length, 1)
    assert.deepEqual(wallet, walletStore.getWallet(wallet.id))
    const key2 = Key.fromMnemonic(mnemonic, '1qaz.2wsx', 17, 3)
    const wallet2 = service.create({ name: '456', keystore: key2.keystore!, addresses: key2.addresses! })
    assert.deepEqual(walletStore.getAllWallets().length, 2)
    assert.deepEqual(wallet2, walletStore.getWallet(wallet2.id))
  })

  it('get wallet', () => {
    const key = Key.fromKeystore(keystoreJson, '1qaz.2wsx', 17, 3)
    const wallet = service.create({ name: '123', keystore: key.keystore!, addresses: key.addresses! })
    assert.deepEqual(wallet, service.get(wallet.id))
    const key2 = Key.fromMnemonic(mnemonic, '1qaz.2wsx', 17, 3)
    const wallet2 = service.create({ name: '456', keystore: key2.keystore!, addresses: key2.addresses! })
    assert.deepEqual(wallet2, service.get(wallet2.id))
  })

  it('get all wallets', () => {
    const key = Key.fromKeystore(keystoreJson, '1qaz.2wsx', 17, 3)
    service.create({ name: '123', keystore: key.keystore!, addresses: key.addresses! })
    assert.deepEqual(walletStore.getAllWallets().length, 1)
    assert.equal(service.getAll({ pageNo: 1, pageSize: 15 }).length, 1)
    const key2 = Key.fromMnemonic(mnemonic, '1qaz.2wsx', 17, 3)
    service.create({ name: '456', keystore: key2.keystore!, addresses: key2.addresses! })
    assert.deepEqual(walletStore.getAllWallets().length, 2)
    assert.equal(service.getAll({ pageNo: 1, pageSize: 15 }).length, 2)
  })

  it('validate', () => {
    const key = Key.fromKeystore(keystoreJson, '1qaz.2wsx', 17, 3)
    const wallet = service.create({ name: '123', keystore: key.keystore!, addresses: key.addresses! })
    assert.equal(service.validate({ id: wallet.id, password: '1qaz.2wsx' }), true)
    assert.equal(service.validate({ id: wallet.id, password: '1qaz.2wsx11' }), false)
  })

  it('delet wallet', () => {
    const key1 = Key.fromKeystore(keystoreJson, '1qaz.2wsx', 17, 3)
    const wallet1 = service.create({ name: '123', keystore: key1.keystore!, addresses: key1.addresses! })
    const key2 = Key.fromMnemonic(mnemonic, '1qaz.2wsx', 17, 3)
    const wallet2 = service.create({ name: '456', keystore: key2.keystore!, addresses: key2.addresses! })
    assert.equal(service.delete(wallet1.id), true)
    assert.equal(service.getAll().length, 1)
    assert.deepEqual(service.get(wallet2.id), wallet2)
  })

  it('active wallet', () => {
    const key = Key.fromKeystore(keystoreJson, '1qaz.2wsx', 17, 3)
    const wallet = service.create({ name: '123', keystore: key.keystore!, addresses: key.addresses! })
    const key2 = Key.fromMnemonic(mnemonic, '1qaz.2wsx', 17, 3)
    const wallet2 = service.create({ name: '456', keystore: key2.keystore!, addresses: key2.addresses! })
    assert.deepEqual(service.getActive(), wallet)
    service.setActive(wallet2.id)
    assert.deepEqual(service.getActive(), wallet2)
    service.delete(wallet2.id)
    assert.deepEqual(service.getActive(), wallet)
  })
})

const assert = require('assert')
const WalletStore = require('../../dist/store/WalletStore').default

describe('wallet store', () => {
  it('save wallet', () => {
    const walletStore = new WalletStore()
    const mKeystore = {
      master: {
        privateKey: '123',
        chainCode: '123',
      },
    }
    const walletId = walletStore.saveWallet('123', mKeystore)
    const wallet = walletStore.getWallet(walletId)
    assert.deepEqual(wallet, {
      id: walletId,
      name: '123',
      keystore: mKeystore,
    })
  })
})

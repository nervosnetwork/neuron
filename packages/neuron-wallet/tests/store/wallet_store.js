const assert = require('assert')
const WalletStore = require('../../dist/store/WalletStore').default

describe('wallet store', () => {
  const walletStore = new WalletStore()

  const mWalletName1 = 'wallet1'
  const mKeystore1 = {
    master: {
      privateKey: 'privateKey1',
      chainCode: 'chainCode1',
    },
  }

  const mWalletName2 = 'wallet2'
  const mKeystore2 = {
    master: {
      privateKey: 'privateKey2',
      chainCode: 'chainCode2',
    },
  }

  const mWalletName3 = 'wallet3'
  const mKeystore3 = {
    master: {
      privateKey: 'privateKey3',
      chainCode: 'chainCode3',
    },
  }

  beforeEach(() => {
    walletStore.clearAll()
  })

  it('save wallet', () => {
    const walletId = walletStore.saveWallet(mWalletName1, mKeystore1)
    walletStore.saveWallet(mWalletName2, mKeystore2)
    const wallet = walletStore.getWallet(walletId)
    assert.deepEqual(wallet, {
      id: walletId,
      name: mWalletName1,
      keystore: mKeystore1,
    })
  })

  it('save same wallet', () => {
    const walletId1 = walletStore.saveWallet(mWalletName1, mKeystore1)
    const walletId2 = walletStore.saveWallet(mWalletName1, mKeystore1)
    const wallet1 = walletStore.getWallet(walletId1)
    const wallet2 = walletStore.getWallet(walletId2)
    assert.notEqual(walletId1, walletId2)
    assert.deepEqual(wallet1, {
      id: walletId1,
      name: mWalletName1,
      keystore: mKeystore1,
    })
    assert.deepEqual(wallet2, {
      id: walletId2,
      name: mWalletName1,
      keystore: mKeystore1,
    })
  })

  it('get not exist wallet', () => {
    walletStore.saveWallet(mWalletName1, mKeystore1)
    walletStore.saveWallet(mWalletName1, mKeystore1)
    try {
      walletStore.getWallet('1111111111')
    } catch (e) {
      assert.deepEqual(e, 0)
    }
  })

  it('get all wallets', () => {
    const walletId1 = walletStore.saveWallet(mWalletName1, mKeystore1)
    const walletId2 = walletStore.saveWallet(mWalletName2, mKeystore2)
    const walletId3 = walletStore.saveWallet(mWalletName3, mKeystore3)
    const wallets = walletStore.getAllWallets()
    assert.deepEqual(wallets, [
      {
        id: walletId1,
        name: mWalletName1,
        keystore: mKeystore1,
      },
      {
        id: walletId2,
        name: mWalletName2,
        keystore: mKeystore2,
      },
      {
        id: walletId3,
        name: mWalletName3,
        keystore: mKeystore3,
      },
    ])
  })

  it('rename wallet', () => {
    const walletId = walletStore.saveWallet(mWalletName1, mKeystore1)
    walletStore.saveWallet(mWalletName2, mKeystore2)
    walletStore.renameWallet(walletId, mWalletName2)
    const wallet = walletStore.getWallet(walletId)
    assert.deepEqual(wallet, {
      id: walletId,
      name: mWalletName2,
      keystore: mKeystore1,
    })
  })

  it('delete wallet', () => {
    const walletId = walletStore.saveWallet(mWalletName1, mKeystore1)
    walletStore.saveWallet(mWalletName2, mKeystore2)
    walletStore.deleteWallet(walletId)
    try {
      walletStore.getWallet(walletId)
    } catch (e) {
      assert.deepEqual(e, 0)
    }
  })
})

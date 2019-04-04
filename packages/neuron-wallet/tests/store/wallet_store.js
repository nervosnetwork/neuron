const assert = require('assert')
const uuid = require('uuid')
const WalletStore = require('../../dist/store/WalletStore').default

describe('wallet store', () => {
  const walletStore = new WalletStore()

  const wallet1 = {
    id: uuid.v4(),
    name: 'wallet1',
    keystore: {
      version: 0,
      id: '0',
      crypto: { cipher: 'wallet1', cipherparams: null, ciphertext: 'wallet1', kdf: '1', kdfparams: null, mac: '1' },
    },
    addresses: {
      receive: ['address1', 'address2', 'address3'],
      change: ['address1', 'address2', 'address3'],
    },
  }
  const wallet2 = {
    id: uuid.v4(),
    name: 'wallet2',
    keystore: {
      version: 0,
      id: '1',
      crypto: { cipher: 'wallet2', cipherparams: null, ciphertext: 'wallet2', kdf: '2', kdfparams: null, mac: '2' },
    },
    addresses: {
      receive: ['address1', 'address2', 'address3'],
      change: ['address1', 'address2', 'address3'],
    },
  }
  const wallet3 = {
    id: uuid.v4(),
    name: 'wallet3',
    keystore: {
      version: 0,
      id: '1',
      crypto: { cipher: 'wallet3', cipherparams: null, ciphertext: 'wallet3', kdf: '3', kdfparams: null, mac: '3' },
    },
    addresses: {
      receive: ['address1', 'address2', 'address3'],
      change: ['address1', 'address2', 'address3'],
    },
  }

  beforeEach(() => {
    walletStore.clearAll()
  })

  it('save wallet', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    const wallet = walletStore.getWallet(wallet1.id)
    assert.deepEqual(wallet, wallet1)
  })

  it('get not exist wallet', () => {
    walletStore.saveWallet(wallet1)
    try {
      walletStore.getWallet('1111111111')
    } catch (e) {
      assert.deepEqual(e, 0)
    }
  })

  it('get all wallets', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    walletStore.saveWallet(wallet3)
    const wallets = walletStore.getAllWallets()
    assert.deepEqual(wallets, [wallet1, wallet2, wallet3])
  })

  it('rename wallet', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    walletStore.renameWallet(wallet1.id, wallet2.name)
    const wallet = walletStore.getWallet(wallet1.id)
    assert.deepEqual(wallet, {
      id: wallet1.id,
      name: wallet2.name,
      keystore: wallet1.keystore,
      addresses: wallet1.addresses,
    })
  })

  it('delete wallet', () => {
    const walletId = walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    walletStore.deleteWallet(walletId)
    try {
      walletStore.getWallet(walletId)
    } catch (e) {
      assert.deepEqual(e, 0)
    }
  })
})

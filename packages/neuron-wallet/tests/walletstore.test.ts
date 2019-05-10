import assert from 'assert'
import WalletStore, { WalletData } from '../src/store/walletStore'

describe('wallet store', () => {
  let walletStore: WalletStore

  const wallet1: WalletData = {
    id: '1',
    name: 'wallet1',
    keystore: {
      version: 0,
      id: '0',
      crypto: {
        cipher: 'wallet1',
        cipherparams: { iv: 'wallet1' },
        ciphertext: 'wallet1',
        kdf: '1',
        kdfparams: {
          dklen: 1,
          n: 1,
          r: 1,
          p: 1,
          salt: '1',
        },
        mac: '1',
      },
    },
    addresses: {
      receiving: [
        {
          address: 'address1',
          path: 'path1',
        },
        {
          address: 'address2',
          path: 'path2',
        },
        {
          address: 'address3',
          path: 'path3',
        },
      ],
      change: [
        {
          address: 'address1',
          path: 'path1',
        },
        {
          address: 'address2',
          path: 'path2',
        },
        {
          address: 'address3',
          path: 'path3',
        },
      ],
    },
  }

  const wallet2: WalletData = {
    id: '2',
    name: 'wallet2',
    keystore: {
      version: 0,
      id: '1',
      crypto: {
        cipher: 'wallet2',
        cipherparams: { iv: 'wallet2' },
        ciphertext: 'wallet2',
        kdf: '2',
        kdfparams: {
          dklen: 1,
          n: 1,
          r: 1,
          p: 1,
          salt: '1',
        },
        mac: '2',
      },
    },
    addresses: {
      receiving: [
        {
          address: 'address1',
          path: 'path1',
        },
        {
          address: 'address2',
          path: 'path2',
        },
        {
          address: 'address3',
          path: 'path3',
        },
      ],
      change: [
        {
          address: 'address1',
          path: 'path1',
        },
        {
          address: 'address2',
          path: 'path2',
        },
        {
          address: 'address3',
          path: 'path3',
        },
      ],
    },
  }
  const wallet3: WalletData = {
    id: '3',
    name: 'wallet3',
    keystore: {
      version: 0,
      id: '1',
      crypto: {
        cipher: 'wallet3',
        cipherparams: { iv: 'wallet1' },
        ciphertext: 'wallet3',
        kdf: '3',
        kdfparams: {
          dklen: 1,
          n: 1,
          r: 1,
          p: 1,
          salt: '1',
        },
        mac: '3',
      },
    },
    addresses: {
      receiving: [
        {
          address: 'address1',
          path: 'path1',
        },
        {
          address: 'address2',
          path: 'path2',
        },
        {
          address: 'address3',
          path: 'path3',
        },
      ],
      change: [
        {
          address: 'address1',
          path: 'path1',
        },
        {
          address: 'address2',
          path: 'path2',
        },
        {
          address: 'address3',
          path: 'path3',
        },
      ],
    },
  }

  beforeEach(() => {
    walletStore = new WalletStore('test/wallets')
  })

  afterEach(() => {
    walletStore.clearAll()
  })

  it('save wallet', () => {
    walletStore.saveWallet(wallet1)
    const wallet = walletStore.getWallet(wallet1.id)
    assert.deepStrictEqual(wallet, wallet1)
  })

  it('get not exist wallet', () => {
    walletStore.saveWallet(wallet1)
    try {
      walletStore.getWallet('1111111111')
    } catch (e) {
      assert.deepStrictEqual(e, 0)
    }
  })

  it('get all wallets', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    walletStore.saveWallet(wallet3)
    const wallets = walletStore.getAllWallets()
    assert.deepStrictEqual(wallets, [wallet1, wallet2, wallet3])
  })

  it('rename wallet', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    wallet1.name = wallet2.name
    walletStore.updateWallet(wallet1.id, wallet1)
    const wallet = walletStore.getWallet(wallet1.id)
    assert.deepStrictEqual(wallet, {
      id: wallet1.id,
      name: wallet2.name,
      keystore: wallet1.keystore,
      addresses: wallet1.addresses,
    })
  })

  it('update addresses', () => {
    walletStore.saveWallet(wallet1)
    const addresses = {
      receiving: [
        {
          address: 'address1',
          path: 'path1',
        },
        {
          address: 'address2',
          path: 'path2',
        },
        {
          address: 'address3',
          path: 'path3',
        },
      ],
      change: [
        {
          address: 'address1',
          path: 'path1',
        },
        {
          address: 'address2',
          path: 'path2',
        },
        {
          address: 'address3',
          path: 'path3',
        },
      ],
    }
    wallet1.addresses = addresses
    walletStore.updateWallet(wallet1.id, wallet1)
    const wallet = walletStore.getWallet(wallet1.id)
    assert.deepStrictEqual(wallet, {
      id: wallet1.id,
      name: wallet1.name,
      keystore: wallet1.keystore,
      addresses,
    })
  })

  it('delete wallet', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    walletStore.deleteWallet(wallet1.id)
    try {
      assert.notDeepStrictEqual(walletStore.getWallet(wallet1.id), wallet1)
    } catch (e) {
      assert.strictEqual(e, 0)
    }
  })

  it('get and set active wallet', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    assert.strictEqual(walletStore.setCurrentWallet(wallet1.id), true)
    assert.deepStrictEqual(walletStore.getCurrentWallet(), wallet1)
    assert.strictEqual(walletStore.setCurrentWallet(wallet2.id), true)
    assert.deepStrictEqual(walletStore.getCurrentWallet(), wallet2)
    assert.strictEqual(walletStore.setCurrentWallet(wallet1.id), true)
  })

  it('first wallet is active wallet', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    assert.deepStrictEqual(walletStore.getCurrentWallet(), wallet1)
  })

  it('delete active wallet', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    walletStore.deleteWallet(wallet1.id)
    const activeWallet = walletStore.getCurrentWallet()
    assert.deepStrictEqual(activeWallet, wallet2)
    assert.strictEqual(walletStore.getAllWallets().length, 1)
  })

  it('delete inactive wallet', () => {
    walletStore.saveWallet(wallet1)
    walletStore.saveWallet(wallet2)
    walletStore.deleteWallet(wallet2.id)
    const activeWallet = walletStore.getCurrentWallet()
    assert.deepStrictEqual(activeWallet, wallet1)
  })
})

import assert from 'assert'
import WalletService, { Wallet } from '../../src/services/wallets'

describe('wallet service', () => {
  let walletService: WalletService

  const wallet1: Wallet = {
    id: 'na',
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

  const wallet2: Wallet = {
    id: 'na',
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
  const wallet3: Wallet = {
    id: 'na',
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
    walletService = new WalletService('test/wallets')
  })

  afterEach(() => {
    walletService.clearAll()
  })

  it('save wallet', () => {
    const { id } = walletService.create(wallet1)
    const wallet = walletService.get(id)
    assert.deepStrictEqual(wallet, { ...wallet1, id })
  })

  it('wallet not exist', () => {
    const wallet = walletService.get('1111111111')
    expect(wallet).toBeUndefined()
  })

  it('get all wallets', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    const w3 = walletService.create(wallet3)
    assert.deepStrictEqual(walletService.getAll(), [w1, w2, w3])
  })

  it('rename wallet', () => {
    const w1 = walletService.create(wallet1)
    wallet1.name = wallet2.name
    walletService.update(w1.id, wallet1)
    const wallet = walletService.get(w1.id)
    expect(wallet).toBeDefined()
    expect(wallet!.name).toEqual(wallet2.name)
  })

  it('update addresses', () => {
    const w1 = walletService.create(wallet1)
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
    walletService.update(w1.id, wallet1)
    const wallet = walletService.get(w1.id)
    assert.deepStrictEqual(wallet, {
      id: w1.id,
      name: wallet1.name,
      keystore: wallet1.keystore,
      addresses,
    })
  })

  it('delete wallet', () => {
    const w1 = walletService.create(wallet1)
    walletService.create(wallet2)
    walletService.delete(w1.id)
    const wallet = walletService.get(w1.id)
    expect(wallet).toBeUndefined()
  })

  it('get and set active wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    assert.strictEqual(walletService.setCurrent(w1.id), true)
    assert.deepStrictEqual(walletService.getCurrent(), w1)
    assert.strictEqual(walletService.setCurrent(w2.id), true)
    assert.deepStrictEqual(walletService.getCurrent(), w2)
    assert.strictEqual(walletService.setCurrent(w1.id), true)
  })

  it('first wallet is active wallet', () => {
    const w1 = walletService.create(wallet1)
    walletService.create(wallet2)
    assert.deepStrictEqual(walletService.getCurrent(), w1)
  })

  it('delete current wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    walletService.delete(w1.id)
    const activeWallet = walletService.getCurrent()
    assert.deepStrictEqual(activeWallet, w2)
    assert.strictEqual(walletService.getAll().length, 1)
  })

  it('delete none current wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    walletService.delete(w2.id)
    const activeWallet = walletService.getCurrent()
    assert.deepStrictEqual(activeWallet, w1)
  })
})

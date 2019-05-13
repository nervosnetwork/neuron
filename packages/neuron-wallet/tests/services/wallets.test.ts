import WalletService, { WalletProperties } from '../../src/services/wallets'

describe('wallet service', () => {
  let walletService: WalletService

  let wallet1: WalletProperties
  let wallet2: WalletProperties
  let wallet3: WalletProperties

  beforeEach(() => {
    walletService = new WalletService('test/wallets')
    wallet1 = {
      name: 'wallet-test1',
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

    wallet2 = {
      name: 'wallet-test2',
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

    wallet3 = {
      name: 'wallet-test3',
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
  })

  afterEach(() => {
    walletService.clearAll()
  })

  it('save wallet', () => {
    const { id } = walletService.create(wallet1)
    const wallet = walletService.get(id)
    expect(wallet).toBeDefined()
    expect(wallet!.name).toEqual(wallet1.name)
  })

  it('wallet not exist', () => {
    const wallet = walletService.get('1111111111')
    expect(wallet).toBeUndefined()
  })

  it('get all wallets', () => {
    walletService.create(wallet1)
    walletService.create(wallet2)
    walletService.create(wallet3)
    expect(walletService.getAll().length).toBe(3)
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
    walletService.update(w1.id, wallet2)
    const wallet = walletService.get(w1.id)
    expect(wallet).toBeDefined()
    expect(wallet!.addresses).toEqual(addresses)
  })

  it('delete wallet', () => {
    const w1 = walletService.create(wallet1)
    walletService.create(wallet2)
    expect(walletService.getAll().length).toBe(2)
    walletService.delete(w1.id)
    const wallet = walletService.get(w1.id)
    expect(wallet).toBeUndefined()
  })

  it('get and set active wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    expect(walletService.setCurrent(w1.id)).toBeTruthy()
    expect(walletService.getCurrent()!.id).toEqual(w1.id)
    expect(walletService.setCurrent(w2.id)).toBeTruthy()
    expect(walletService.getCurrent()!.id).toEqual(w2.id)
    expect(walletService.setCurrent(w1.id)).toBeTruthy()
  })

  it('first wallet is active wallet', () => {
    const w1 = walletService.create(wallet1)
    walletService.create(wallet2)
    const activeWallet = walletService.getCurrent()
    expect(activeWallet).toBeDefined()
    expect(activeWallet!.id).toEqual(w1.id)
  })

  it('delete current wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    walletService.delete(w1.id)
    const activeWallet = walletService.getCurrent()
    expect(activeWallet).toBeDefined()
    expect(activeWallet!.id).toEqual(w2.id)
    expect(walletService.getAll().length).toEqual(1)
  })

  it('delete none current wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    walletService.delete(w2.id)
    const activeWallet = walletService.getCurrent()
    expect(activeWallet).toBeDefined()
    expect(activeWallet!.id).toEqual(w1.id)
  })
})

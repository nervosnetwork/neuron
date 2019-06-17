import WalletService, { WalletProperties } from '../../src/services/wallets'
import { Witness } from '../../src/app-types/types'

describe('wallet service', () => {
  let walletService: WalletService

  let wallet1: WalletProperties
  let wallet2: WalletProperties
  let wallet3: WalletProperties

  beforeEach(() => {
    walletService = new WalletService()
    wallet1 = {
      name: 'wallet-test1',
      keystore: {
        version: 3,
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
        version: 3,
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
        version: 3,
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
    expect(wallet && wallet.name).toEqual(wallet1.name)
  })

  it('wallet not exist', () => {
    const id = '1111111111'
    expect(() => walletService.get(id)).toThrowError()
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
    expect(wallet && wallet.name).toEqual(wallet2.name)
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
    expect(wallet && wallet.addresses).toEqual(addresses)
  })

  it('delete wallet', () => {
    const w1 = walletService.create(wallet1)
    walletService.create(wallet2)
    expect(walletService.getAll().length).toBe(2)
    walletService.delete(w1.id)
    expect(() => walletService.get(w1.id)).toThrowError()
  })

  it('get and set active wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)

    expect(() => walletService.setCurrent(w1.id)).not.toThrowError()

    let currentWallet = walletService.getCurrent()
    expect(currentWallet && currentWallet.id).toEqual(w1.id)

    expect(() => walletService.setCurrent(w2.id)).not.toThrowError()

    currentWallet = walletService.getCurrent()
    expect(currentWallet && currentWallet.id).toEqual(w2.id)

    expect(() => walletService.setCurrent(w1.id)).not.toThrowError()
  })

  it('first wallet is active wallet', () => {
    const w1 = walletService.create(wallet1)
    walletService.create(wallet2)
    const activeWallet = walletService.getCurrent()
    expect(activeWallet && activeWallet.id).toEqual(w1.id)
  })

  it('delete current wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    walletService.delete(w1.id)
    const activeWallet = walletService.getCurrent()
    expect(activeWallet && activeWallet.id).toEqual(w2.id)
    expect(walletService.getAll().length).toEqual(1)
  })

  it('delete none current wallet', () => {
    const w1 = walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    walletService.delete(w2.id)
    const activeWallet = walletService.getCurrent()
    expect(activeWallet && activeWallet.id).toEqual(w1.id)
  })
})

describe('sign witness', () => {
  const witness: Witness = { data: [] }
  const privateKey: string = '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3'
  const txHash = '0x00f5f31941964004d665a8762df8eb4fab53b5ef8437b7d34a38e018b1409054'
  const expectedData = [
    '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01',
    '0x304502210099b79ff84dc39de16ec7ed2e9a2836a2560b95a71041ad3a6c00b2d31844db4c022026b760918bbe08747ead167cccb35b1b9ba4db42896c19e412b885cd6589d41a',
  ]

  it('success', () => {
    const wallet = new WalletService()
    const newWitness = wallet.signWitness(witness, privateKey, txHash)
    expect(newWitness.data).toEqual(expectedData)
  })
})

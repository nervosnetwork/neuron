import '../../src/controllers/wallets'
import '../../src/controllers/app'
import WalletService, { WalletProperties } from '../../src/services/wallets'
import { Witness } from '../../src/types/cell-types'
import Keystore from '../../src/models/keys/keystore'
import Keychain from '../../src/models/keys/keychain'
import { mnemonicToSeedSync } from '../../src/models/keys/mnemonic'
import { ExtendedPrivateKey, AccountExtendedPublicKey } from '../../src/models/keys/key'

describe('wallet service', () => {
  let walletService: WalletService

  let wallet1: WalletProperties
  let wallet2: WalletProperties
  let wallet3: WalletProperties

  beforeEach(() => {
    walletService = new WalletService()
    wallet1 = {
      name: 'wallet-test1',
      id: '',
      extendedKey: '',
      keystore: new Keystore(
        {
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
        '0'
      ),
    }

    wallet2 = {
      name: 'wallet-test2',
      id: '',
      extendedKey: '',
      keystore: new Keystore(
        {
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
        '2'
      ),
    }

    wallet3 = {
      name: 'wallet-test3',
      id: '',
      extendedKey: '',
      keystore: new Keystore(
        {
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
        '3'
      ),
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
    '0x99b79ff84dc39de16ec7ed2e9a2836a2560b95a71041ad3a6c00b2d31844db4c26b760918bbe08747ead167cccb35b1b9ba4db42896c19e412b885cd6589d41a00',
  ]

  it('success', () => {
    const wallet = new WalletService()
    const newWitness = wallet.signWitness(witness, privateKey, txHash)
    expect(newWitness.data).toEqual(expectedData)
  })
})

describe('get keys with paths', () => {
  const walletService = WalletService.getInstance()
  const mnemonic = 'tank planet champion pottery together intact quick police asset flower sudden question'
  const password = '1234abc~'
  const receivingPath = `m/44'/309'/0'/0/0`
  const changePath = `m/44'/309'/0'/1/0`
  const receivingPrivateKey = '0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14'
  // const receivingPublicKey = '0x034dc074f2663d73aedd36f5fc2d1a1e4ec846a4dffa62d8d8bae8a4d6fffdf2b0'
  const changePriateKey = '0x15ec3e9ba7024557a116f37f08a99ee7769882c2cb4cfabeced1662394279747'
  // const changePublicKey = '03f3600eb8f2bd7675fd7763dbe3fc36a1103e45b46629860a88a374bcf015df03'

  it('get keys', () => {
    const seed = mnemonicToSeedSync(mnemonic)
    const masterKeychain = Keychain.fromSeed(seed)
    const extendedKey = new ExtendedPrivateKey(
      masterKeychain.privateKey.toString('hex'),
      masterKeychain.chainCode.toString('hex')
    )
    const p = masterKeychain.derivePath(receivingPath).privateKey.toString('hex')
    expect(`0x${p}`).toEqual(receivingPrivateKey)
    const keystore = Keystore.create(extendedKey, password)

    const accountKeychain = masterKeychain.derivePath(AccountExtendedPublicKey.ckbAccountPath)
    const accountExtendedPublicKey = new AccountExtendedPublicKey(
      accountKeychain.publicKey.toString('hex'),
      accountKeychain.chainCode.toString('hex')
    )

    const wallet = walletService.create({
      id: '',
      name: 'Test Wallet',
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore,
    })

    const masterPrivateKey = wallet.loadKeystore().extendedPrivateKey(password)
    expect(masterKeychain.privateKey.toString('hex')).toEqual(masterPrivateKey.privateKey)

    const pathsAndKeys = walletService.getPrivateKeys(wallet, [receivingPath, changePath], password)
    expect(pathsAndKeys[0]).toEqual({
      path: receivingPath,
      privateKey: receivingPrivateKey,
    })
    expect(pathsAndKeys[1]).toEqual({
      path: changePath,
      privateKey: changePriateKey,
    })
  })
})

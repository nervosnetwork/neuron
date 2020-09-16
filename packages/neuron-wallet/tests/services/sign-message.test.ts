import SignMessage from '../../src/services/sign-message'
import WalletService, { Wallet } from '../../src/services/wallets'
import Keystore from '../../src/models/keys/keystore'
import { ExtendedPrivateKey, AccountExtendedPublicKey } from '../../src/models/keys/key'
import AddressService from '../../src/services/addresses'
import { mnemonicToSeedSync } from '../../src/models/keys/mnemonic'
import Keychain from '../../src/models/keys/keychain'
import initConnection from '../../src/database/chain/ormconfig'
import { getConnection } from 'typeorm'

describe(`SignMessage`, () => {
  const info = {
    privateKey: '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3',
    message: 'HelloWorld',
    digest: '0xdfb48ccf7126479c052f68cb4202cd094632d30198a322e3c3638679bc73858d',
    address: 'ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd',
    signture: '0x97ed8c48879eed50743532bf7cc53e641c501509d2be19d06e6496dd944a21b4509136f18c8e139cc4002822b2deb5cbaff8e44b8782769af3113ff7fb8bd92700'
  }

  const extendedKeyInfo = {
    mnemonic: 'tank planet champion pottery together intact quick police asset flower sudden question',
    password: '123456Ab',
  }

  const signInfo = {
    index: 0,
    path: "m/44'/309'/0'/0/0",
    privateKey: '0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14',
    message: 'HelloWorld',
    address: 'ckb1qyqgnjay335t89u0rpwlr8e3vd9msu8fgcuszgdmkp',
    signture: '0x0050e46c60cee0b85387a3d16300d74f4761b157857f13ee0ab9cc8df419dd265bbd4babc9ef4c1fb39803d2afd0901104271da026087200a154f037fd88cef201',
  }

  const signInfo2 = {
    index: 2,
    path: "m/44'/309'/0'/0/2",
    privateKey: '0x72c0420a2ecfbe8a00a036570c6ce774a40cb344a03ede8eccf0279868485547',
    message: 'HelloWorld',
    address: 'ckb1qyqvxd762w0y6zufm2k3xu9eghmjzradf3psc4h22q',
    signture: 'jYMFakfAM9Fn2914p/SnR2K8KEmvhRwI6ok/0br9B98NQELkOMtVJRmJCR3atBO75X2O5rpeNprUtquh+nSytwA=',
  }

  describe('with extended key', () => {
    let wallet: Wallet
    const walletService = new WalletService()

    SignMessage.GENERATE_COUNT = 3

    beforeAll(async () => {
      await initConnection('')
    })

    afterAll(async () => {
      await getConnection().close()
    })

    beforeEach(async () => {
      const connection = getConnection()
      await connection.synchronize(true)

      const seed = mnemonicToSeedSync(extendedKeyInfo.mnemonic)
      const masterKeychain = Keychain.fromSeed(seed)
      const extendedKey = new ExtendedPrivateKey(
        masterKeychain.privateKey.toString('hex'),
        masterKeychain.chainCode.toString('hex')
      )
      const keystore = Keystore.create(extendedKey, extendedKeyInfo.password)

      const accountKeychain = masterKeychain.derivePath(AccountExtendedPublicKey.ckbAccountPath)
      const accountExtendedPublicKey = new AccountExtendedPublicKey(
        accountKeychain.publicKey.toString('hex'),
        accountKeychain.chainCode.toString('hex')
      )

      wallet = walletService.create({
        id: '',
        name: 'Test Wallet',
        extendedKey: accountExtendedPublicKey.serialize(),
        keystore,
      })

      //@ts-ignore
      await AddressService.generateAndSave(wallet.id, accountExtendedPublicKey, 0, 0, 2, 1)
    })

    afterEach(() => {
      walletService.clearAll()
    })

    describe('sign', () => {
      it('not generate', async () => {
        const result = await SignMessage.sign(wallet.id, signInfo.address, extendedKeyInfo.password, signInfo.message)

        expect(result).toEqual(signInfo.signture)
      })

      it('with generate', async () => {
        await expect(SignMessage.sign(wallet.id, signInfo2.address, extendedKeyInfo.password, signInfo2.message)).rejects.toThrow()
      })
    })
  })

  it("signByPrivateKey", () => {
    // @ts-ignore: Private method
    const sig = SignMessage.signByPrivateKey(info.privateKey, info.message)
    expect(sig).toEqual(info.signture)
  })

  it('verify', () => {
    const result = SignMessage.verify(info.address, info.signture, info.message)
    expect(result).toBeTruthy()
  })

  it('verify false', () => {
    const result = SignMessage.verify(signInfo.address, info.signture, info.message)
    expect(result).toBeFalsy()
  })
})

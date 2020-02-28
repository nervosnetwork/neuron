import SignMessage from '../../src/services/sign-message'
import WalletService, { Wallet } from '../../src/services/wallets'
import Keystore from '../../src/models/keys/keystore'
import { ExtendedPrivateKey, AccountExtendedPublicKey } from '../../src/models/keys/key'
import AddressDao from "../../src/database/address/address-dao"
import AddressService from '../../src/services/addresses'
import { mnemonicToSeedSync } from '../../src/models/keys/mnemonic'
import Keychain from '../../src/models/keys/keychain'

describe(`SignMessage`, () => {
  const info = {
    privateKey: '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3',
    message: 'HelloWorld',
    digest: '0xdfb48ccf7126479c052f68cb4202cd094632d30198a322e3c3638679bc73858d',
    signature: '0x33cb08f423e8e2c05b0810c01e0e0f89c37b2426de76e8a50a54b2df3141b2e915f89bdbd1ff815dc2a4d627bc006bdf6f3a02bd7f351f1a5746207883eb13c000',
    address: 'ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd',
    sigBase64: 'M8sI9CPo4sBbCBDAHg4PicN7JCbeduilClSy3zFBsukV+Jvb0f+BXcKk1ie8AGvfbzoCvX81HxpXRiB4g+sTwAA='
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
    signature: '0xd9139c161fb753c96ced8c24c810c1bb2252da0366496dbca0cba02d3441df7f48ef6ce00416e74e04e329ffdb0281da23fe1d2fbe10f673f1c3cb9184bd5d9f01',
    address: 'ckb1qyqgnjay335t89u0rpwlr8e3vd9msu8fgcuszgdmkp',
    sigBase64: '2ROcFh+3U8ls7YwkyBDBuyJS2gNmSW28oMugLTRB339I72zgBBbnTgTjKf/bAoHaI/4dL74Q9nPxw8uRhL1dnwE=',
  }

  const signInfo2 = {
    index: 2,
    path: "m/44'/309'/0'/0/2",
    privateKey: '0x72c0420a2ecfbe8a00a036570c6ce774a40cb344a03ede8eccf0279868485547',
    message: 'HelloWorld',
    signature: '0x8d83056a47c033d167dbdd78a7f4a74762bc2849af851c08ea893fd1bafd07df0d4042e438cb55251989091ddab413bbe57d8ee6ba5e369ad4b6aba1fa74b2b700',
    address: 'ckb1qyqvxd762w0y6zufm2k3xu9eghmjzradf3psc4h22q',
    sigBase64: 'jYMFakfAM9Fn2914p/SnR2K8KEmvhRwI6ok/0br9B98NQELkOMtVJRmJCR3atBO75X2O5rpeNprUtquh+nSytwA=',
  }

  describe('with extended key', () => {
    let wallet: Wallet
    const walletService = new WalletService()

    SignMessage.GENERATE_COUNT = 3

    beforeEach(() => {
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

      AddressService.generateAndSave(wallet.id, accountExtendedPublicKey, undefined, 0, 0, 2, 1)
    })

    afterEach(() => {
      AddressDao.deleteAll()
      walletService.clearAll()
    })

    describe('sign', () => {
      it('not generate', () => {
        const result = SignMessage.sign(wallet.id, signInfo.address, extendedKeyInfo.password, signInfo.message)

        expect(result).toEqual(signInfo.sigBase64)
      })

      it('with generate', () => {
        expect(() => {
          SignMessage.sign(wallet.id, signInfo2.address, extendedKeyInfo.password, signInfo2.message)
        }).toThrowError()
      })
    })
  })

  it("signByPrivateKey", () => {
    // @ts-ignore: Private method
    const sig = SignMessage.signByPrivateKey(info.privateKey, info.message)
    expect(sig).toEqual(info.sigBase64)
  })

  it('verify', () => {
    const result = SignMessage.verify(info.address, info.sigBase64, info.message)
    expect(result).toBeTruthy()
  })

  it('verify false', () => {
    const result = SignMessage.verify(signInfo.address, info.sigBase64, info.message)
    expect(result).toBeFalsy()
  })
})

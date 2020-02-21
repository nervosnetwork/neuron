import SignAndVerify from '../../src/services/sign-and-verify'
import WalletService, { Wallet } from '../../src/services/wallets'
import Keystore from '../../src/models/keys/keystore'
import { ExtendedPrivateKey, AccountExtendedPublicKey } from '../../src/models/keys/key'
import AddressDao, { AddressVersion, Address } from "../../src/database/address/address-dao"
import AddressService from '../../src/services/addresses'
import { AddressType } from '../../src/models/keys/address'

describe(`SignAndVerify`, () => {
  const info = {
    privateKey: '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3',
    message: 'HelloWorld',
    digest: '0xdfb48ccf7126479c052f68cb4202cd094632d30198a322e3c3638679bc73858d',
    signature: '0x33cb08f423e8e2c05b0810c01e0e0f89c37b2426de76e8a50a54b2df3141b2e915f89bdbd1ff815dc2a4d627bc006bdf6f3a02bd7f351f1a5746207883eb13c000',
    address: 'ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd',
    sigBase64: 'M8sI9CPo4sBbCBDAHg4PicN7JCbeduilClSy3zFBsukV+Jvb0f+BXcKk1ie8AGvfbzoCvX81HxpXRiB4g+sTwAA='
  }

  const extendedKeyInfo = {
    privateKey: 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
    publicKey: '0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
    chainCode: '873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508',
    password: '123456Ab',
  }

  const signInfo = {
    index: 0,
    privateKey: '0xfcba4708f1f07ddc00fc77422d7a70c72b3456f5fef3b2f68368cdee4e6fb498',
    message: 'HelloWorld',
    signature: '0x44a132e0068a4558d48a13853afe82fe840e1134bf43bd6b157235555ee798b14bec4a3da5e56eb380cf208b8d8043668cf0fccdb23525e32146d1879e08a2b900',
    address: 'ckb1qyq2jse3ehy5danjhh7mrayeljm4rfdj5hvqw0atp4',
    sigBase64: 'RKEy4AaKRVjUihOFOv6C/oQOETS/Q71rFXI1VV7nmLFL7Eo9peVus4DPIIuNgENmjPD8zbI1JeMhRtGHngiiuQA=',
  }

  const signInfo2 = {
    index: 2,
    privateKey: '0x14ced302b7efdacbd7be1d769e7fdd08f5940b9d3f6e092d336009955acd15ec',
    message: 'HelloWorld',
    signature: '0x11cd502f423fe6e377f6e223de4e3690e733b592fa2b5c122b6dd2db95110f0516c221c2d6b6ea65f8e3bc236e7bddd906c4a579f419c9acd7bbd56f8b362fdc00',
    address: 'ckb1qyqdgtdkdrtn0njzvtj8xjhk8ryefxsm2mysgr3vvv',
    sigBase64: 'Ec1QL0I/5uN39uIj3k42kOcztZL6K1wSK23S25URDwUWwiHC1rbqZfjjvCNue93ZBsSlefQZyazXu9VvizYv3AA=',
  }

  describe('with extended key', () => {
    let wallet: Wallet
    let addresses: Address[] = []
    const walletService = new WalletService()

    SignAndVerify.GENERATE_COUNT = 3

    beforeEach(() => {
      const extendedKey = new ExtendedPrivateKey(extendedKeyInfo.privateKey, extendedKeyInfo.chainCode)
      const extendedPublicKey = new AccountExtendedPublicKey(extendedKeyInfo.publicKey, extendedKeyInfo.chainCode)
      const serialized = extendedKey.serialize()

      const keyStore = Keystore.create(new ExtendedPrivateKey(extendedKeyInfo.privateKey, extendedKeyInfo.chainCode), extendedKeyInfo.password)
      const wallet1 = {
        name: 'wallet-test1',
        id: '',
        extendedKey: serialized,
        keystore: keyStore
      }

      const { id } = walletService.create(wallet1)
      wallet = walletService.get(id)

      AddressService.generateAndSave(id, extendedPublicKey, undefined, 0, 0, 2, 1)

      addresses = AddressService.allAddressesByWalletId(id, AddressVersion.Mainnet)
    })

    afterEach(() => {
      AddressDao.deleteAll()
      walletService.clearAll()
    })

    it("generateAddresses", () => {
      // @ts-ignore: Private method
      const allAddresses = SignAndVerify.generateAddresses(wallet.id, wallet, addresses, AddressVersion.Testnet)

      expect(
        allAddresses
          .filter(addr => addr.addressType === AddressType.Receiving)
          .map(addr => addr.addressIndex)
          .sort()
      ).toEqual(
        Array.from({length: 5}).map((_, i) => i)
      )

      expect(
        allAddresses
          .filter(addr => addr.addressType === AddressType.Change)
          .map(addr => addr.addressIndex)
          .sort()
      ).toEqual(
        Array.from({length: 4}).map((_, i) => i)
      )
    })

    describe('sign', () => {
      it('not generate', () => {
        const result = SignAndVerify.sign(wallet.id, signInfo.address, extendedKeyInfo.password, signInfo.message)

        expect(result).toEqual(signInfo.sigBase64)
      })

      it('generate1', () => {
        const result = SignAndVerify.sign(wallet.id, signInfo2.address, extendedKeyInfo.password, signInfo2.message)

        expect(result).toEqual(signInfo2.sigBase64)
      })
    })
  })

  it("signByPrivateKey", () => {
    // @ts-ignore: Private method
    const sig = SignAndVerify.signByPrivateKey(info.privateKey, info.message)
    expect(sig).toEqual(info.sigBase64)
  })

  it('verify', () => {
    const result = SignAndVerify.verify(info.address, info.sigBase64, info.message)
    expect(result).toBeTruthy()
  })

  it('verify false', () => {
    const result = SignAndVerify.verify(signInfo.address, info.sigBase64, info.message)
    expect(result).toBeFalsy()
  })
})

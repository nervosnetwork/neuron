import SignMessage from '../../src/services/sign-message'
import { AddressNotFound } from '../../src/exceptions'

const getAddressesByWalletIdMock = jest.fn()
jest.mock('../../src/services/addresses', () => ({
  getAddressesByWalletId: () => getAddressesByWalletIdMock(),
}))

const walletMock = jest.fn().mockReturnValue({
  isHardware: () => false,
})

jest.mock('../../src/services/wallets', () => ({
  getInstance: () => ({
    get() {
      return walletMock()
    },
  }),
}))

const hardWalletMock = jest.fn()

jest.mock('../../src/services/hardware', () => ({
  getInstance: () => ({
    getCurrent() {
      return hardWalletMock()
    },
  }),
}))

// @ts-ignore: Private method
const getPrivateKeyMock = jest.fn().mockImplementation(SignMessage.getPrivateKey)

jest
  // @ts-ignore: Private method
  .spyOn(SignMessage, 'getPrivateKey')
  // @ts-ignore
  .mockImplementation((...args) => getPrivateKeyMock(...args))

describe(`SignMessage`, () => {
  const info = {
    privateKey: '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3',
    message: 'HelloWorld',
    digest: '0xdfb48ccf7126479c052f68cb4202cd094632d30198a322e3c3638679bc73858d',
    address: 'ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd',
    signature:
      '0x97ed8c48879eed50743532bf7cc53e641c501509d2be19d06e6496dd944a21b4509136f18c8e139cc4002822b2deb5cbaff8e44b8782769af3113ff7fb8bd92700',
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
    signature:
      '0x0050e46c60cee0b85387a3d16300d74f4761b157857f13ee0ab9cc8df419dd265bbd4babc9ef4c1fb39803d2afd0901104271da026087200a154f037fd88cef201',
  }

  const signInfo2 = {
    index: 2,
    path: "m/44'/309'/0'/0/2",
    privateKey: '0x72c0420a2ecfbe8a00a036570c6ce774a40cb344a03ede8eccf0279868485547',
    message: 'HelloWorld',
    address: 'ckb1qyqvxd762w0y6zufm2k3xu9eghmjzradf3psc4h22q',
    signature: 'jYMFakfAM9Fn2914p/SnR2K8KEmvhRwI6ok/0br9B98NQELkOMtVJRmJCR3atBO75X2O5rpeNprUtquh+nSytwA=',
  }

  describe('with extended key', () => {
    SignMessage.GENERATE_COUNT = 3

    describe('sign', () => {
      it('not match wallet address', async () => {
        getAddressesByWalletIdMock.mockReturnValueOnce([])
        await expect(
          SignMessage.sign({
            walletID: 'walletId',
            password: extendedKeyInfo.password,
            message: signInfo.message,
            address: signInfo.address,
          })
        ).rejects.toThrow(new AddressNotFound())
      })

      it('with generate', async () => {
        getAddressesByWalletIdMock.mockReturnValueOnce([{ address: signInfo.address }])
        getPrivateKeyMock.mockReturnValueOnce(signInfo.privateKey)
        const res = await SignMessage.sign({
          walletID: 'walletId',
          password: extendedKeyInfo.password,
          message: signInfo.message,
          address: signInfo.address,
        })
        expect(res).toEqual(signInfo.signature)
      })

      it('sign hard wallet', async () => {
        getAddressesByWalletIdMock.mockReturnValueOnce([{ address: signInfo.address }])
        walletMock.mockReturnValueOnce({ isHardware: () => true })
        const signMessage = jest.fn()
        hardWalletMock.mockReturnValueOnce({ signMessage })
        await SignMessage.sign({
          walletID: 'walletId',
          password: extendedKeyInfo.password,
          message: signInfo.message,
          address: signInfo.address,
        })
        expect(signMessage).toHaveBeenCalled()
      })
    })
  })

  it('signByPrivateKey', () => {
    // @ts-ignore: Private method
    const sig = SignMessage.signByPrivateKey(info.privateKey, info.message)
    expect(sig).toEqual(info.signature)
  })

  it('verify', () => {
    const result = SignMessage.verifyOldAndNew(info.address, info.signature, info.message)
    expect(result).toEqual('new-sign')
  })

  it('verify false', () => {
    const result = SignMessage.verifyOldAndNew(signInfo.address, info.signature, info.message)
    expect(result).toBeUndefined()
  })

  it('verify old sign success', () => {
    const result = SignMessage.verifyOldAndNew(signInfo2.address, signInfo2.signature, signInfo2.message)
    expect(result).toEqual('old-sign')
  })
})

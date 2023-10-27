import Keystore from '../../src/models/keys/keystore'
import initConnection from '../../src/database/chain/ormconfig'
import { getConnection } from 'typeorm'
import { when } from 'jest-when'
import { WalletFunctionNotSupported } from '../../src/exceptions/wallet'
import { AddressType } from '../../src/models/keys/address'
import { Manufacturer } from '../../src/services/hardware/common'

const stubbedDeletedByWalletIdFn = jest.fn()
const stubbedGenerateAndSaveForExtendedKeyQueue = jest.fn()
const stubbedGenerateAndSaveForPublicKeyQueueAsyncPush = jest.fn()
const stubbedGetNextUnusedAddressByWalletIdFn = jest.fn()
const stubbedGetNextUnusedChangeAddressByWalletIdFn = jest.fn()
const stubbedGetUnusedReceivingAddressesByWalletIdFn = jest.fn()
const stubbedGetFirstAddressByWalletIdFn = jest.fn()

const stubbedGetAddressesByWalletId = jest.fn()
const stubbedDeleteByWalletId = jest.fn()

jest.doMock('../../src/services/addresses', () => {
  return {
    deleteByWalletId: stubbedDeleteByWalletId,
    generateAndSaveForPublicKeyQueue: {
      asyncPush: stubbedGenerateAndSaveForPublicKeyQueueAsyncPush,
    },
    generateAndSaveForExtendedKeyQueue: {
      asyncPush: stubbedGenerateAndSaveForExtendedKeyQueue,
    },
    getNextUnusedAddressByWalletId: stubbedGetNextUnusedAddressByWalletIdFn,
    getNextUnusedChangeAddressByWalletId: stubbedGetNextUnusedChangeAddressByWalletIdFn,
    getUnusedReceivingAddressesByWalletId: stubbedGetUnusedReceivingAddressesByWalletIdFn,
    getFirstAddressByWalletId: stubbedGetFirstAddressByWalletIdFn,
    getAddressesByWalletId: stubbedGetAddressesByWalletId,
  }
})
import WalletService, { WalletProperties, Wallet } from '../../src/services/wallets'
import { AccountExtendedPublicKey } from '../../src/models/keys/key'
import HdPublicKeyInfo from '../../src/database/chain/entities/hd-public-key-info'

const resetMocks = () => {
  stubbedDeletedByWalletIdFn.mockReset()
  stubbedGenerateAndSaveForExtendedKeyQueue.mockReset()
  stubbedGenerateAndSaveForPublicKeyQueueAsyncPush.mockReset()
  stubbedGetNextUnusedAddressByWalletIdFn.mockReset()
  stubbedGetNextUnusedChangeAddressByWalletIdFn.mockReset()
  stubbedGetUnusedReceivingAddressesByWalletIdFn.mockReset()
  stubbedGetFirstAddressByWalletIdFn.mockReset()
}

describe('wallet service', () => {
  let walletService: WalletService

  let wallet1: WalletProperties
  let wallet2: WalletProperties
  let wallet3: WalletProperties
  let wallet4: WalletProperties
  const fakePublicKey = 'keykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykey'
  const fakeChainCode = 'codecodecodecodecodecodecodecodecodecodecodecodecodecodecodecode'

  beforeAll(async () => {
    await initConnection('')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    resetMocks()
    const connection = getConnection()
    await connection.synchronize(true)

    resetMocks()

    walletService = new WalletService()
    wallet1 = {
      name: 'wallet-test1',
      id: '',
      extendedKey: `${fakePublicKey}${fakeChainCode}`,
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
      extendedKey: 'a',
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
      extendedKey: 'a',
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

    wallet4 = {
      name: 'wallet-test4',
      id: '',
      extendedKey: 'a'.repeat(66) + 'b'.repeat(64),
      device: {
        manufacturer: Manufacturer.Ledger,
        product: 'Nano S',
        isBluetooth: false,
        descriptor: '',
        vendorId: '10086',
        addressIndex: 0,
        addressType: AddressType.Receiving,
      },
    }
  })

  afterEach(() => {
    walletService.clearAll()
  })

  it('wallet not exist', () => {
    const id = '1111111111'
    expect(() => walletService.get(id)).toThrowError()
  })
  describe('with a software wallet', () => {
    let createdWallet: Wallet
    beforeEach(() => {
      createdWallet = walletService.create(wallet1)
    })
    it('saves name', () => {
      const wallet = walletService.get(createdWallet.id)
      expect(wallet.name).toEqual(wallet1.name)
    })
    describe('#loadKeystore', () => {
      it('returns keystore', () => {
        const wallet = walletService.get(createdWallet.id)
        const keystore = wallet.loadKeystore()
        expect(keystore.crypto).toEqual(wallet1.keystore!.crypto)
      })
    })
    describe('#accountExtendedPublicKey', () => {
      it('returns xpubkey', () => {
        const wallet = walletService.get(createdWallet.id)
        const extendedPublicKey = wallet.accountExtendedPublicKey()
        expect(extendedPublicKey.publicKey).toEqual(fakePublicKey)
        expect(extendedPublicKey.chainCode).toEqual(fakeChainCode)
      })
    })
    describe('#getDeviceInfo', () => {
      it('throws error', () => {
        const wallet = walletService.get(createdWallet.id)
        expect(() => wallet.getDeviceInfo()).toThrowError(new WalletFunctionNotSupported(wallet.getDeviceInfo.name))
      })
    })

    describe('#checkAndGenerateAddresses', () => {
      beforeEach(async () => {
        const wallet = await WalletService.getInstance().get(createdWallet.id)
        await wallet.checkAndGenerateAddresses()
      })
      it('calls AddressService.accountExtendedPublicKey', async () => {
        expect(stubbedGenerateAndSaveForExtendedKeyQueue).toHaveBeenCalledWith({
          walletId: createdWallet.id,
          extendedKey: expect.objectContaining({
            chainCode: createdWallet.accountExtendedPublicKey().chainCode,
            publicKey: createdWallet.accountExtendedPublicKey().publicKey,
          }),
          isImporting: false,
          receivingAddressCount: 20,
          changeAddressCount: 10,
        })
      })
    })
    describe('#getNextAddressByWalletId', () => {
      beforeEach(async () => {
        const wallet = await WalletService.getInstance().get(createdWallet.id)
        await wallet.getNextAddress()
      })
      it('calls AddressService.getNextUnusedAddressByWalletId', () => {
        expect(stubbedGetNextUnusedAddressByWalletIdFn).toHaveBeenCalledWith(createdWallet.id)
      })
    })
    describe('#getNextChangeAddressByWalletId', () => {
      beforeEach(async () => {
        const wallet = await WalletService.getInstance().get(createdWallet.id)
        await wallet.getNextChangeAddress()
      })
      it('calls AddressService.getNextUnusedChangeAddressByWalletId', () => {
        expect(stubbedGetNextUnusedChangeAddressByWalletIdFn).toHaveBeenCalledWith(createdWallet.id)
      })
    })
    describe('#getNextReceivingAddressesByWalletId', () => {
      beforeEach(async () => {
        const wallet = await WalletService.getInstance().get(createdWallet.id)
        await wallet.getNextReceivingAddresses()
      })
      it('calls AddressService.getUnusedReceivingAddressesByWalletId', () => {
        expect(stubbedGetUnusedReceivingAddressesByWalletIdFn).toHaveBeenCalledWith(createdWallet.id)
      })
    })
  })
  describe('with a hardware wallet', () => {
    let createdWallet: Wallet
    beforeEach(() => {
      createdWallet = walletService.create(wallet4)
    })
    it('saves name', () => {
      const wallet = walletService.get(createdWallet.id)
      expect(wallet.name).toEqual(wallet4.name)
    })
    describe('#getDeviceInfo', () => {
      it('return device info', () => {
        const wallet = walletService.get(createdWallet.id)
        const device = wallet.getDeviceInfo()
        expect(device).toEqual(wallet4.device)
      })
    })
    describe('#loadKeystore', () => {
      it('throws error', () => {
        const wallet = walletService.get(createdWallet.id)
        expect(() => wallet.loadKeystore()).toThrowError(new WalletFunctionNotSupported(wallet.loadKeystore.name))
      })
    })

    describe('#checkAndGenerateAddresses', () => {
      beforeEach(async () => {
        const wallet = await WalletService.getInstance().get(createdWallet.id)
        await wallet.checkAndGenerateAddresses()
      })
      it('calls AddressService.generateAndSaveForExtendedKey', async () => {
        const { publicKey } = AccountExtendedPublicKey.parse(wallet4.extendedKey)
        expect(stubbedGenerateAndSaveForPublicKeyQueueAsyncPush).toHaveBeenCalledWith({
          walletId: createdWallet.id,
          publicKey,
          addressType: 0,
          addressIndex: 0,
        })
      })
    })
    describe('#getNextAddressByWalletId', () => {
      beforeEach(async () => {
        const wallet = await WalletService.getInstance().get(createdWallet.id)
        await wallet.getNextAddress()
      })
      it('calls AddressService.getGetFirstAddressByWalletId', () => {
        expect(stubbedGetFirstAddressByWalletIdFn).toHaveBeenCalledWith(createdWallet.id)
      })
    })
    describe('#getNextChangeAddressByWalletId', () => {
      beforeEach(async () => {
        const wallet = await WalletService.getInstance().get(createdWallet.id)
        await wallet.getNextChangeAddress()
      })
      it('calls AddressService.getGetFirstAddressByWalletId', () => {
        expect(stubbedGetFirstAddressByWalletIdFn).toHaveBeenCalledWith(createdWallet.id)
      })
    })
    describe('#getNextReceivingAddressesByWalletId', () => {
      beforeEach(async () => {
        const wallet = await WalletService.getInstance().get(createdWallet.id)
        await wallet.getNextReceivingAddresses()
      })
      it('calls AddressService.getGetFirstAddressByWalletId', () => {
        expect(stubbedGetFirstAddressByWalletIdFn).toHaveBeenCalledWith(createdWallet.id)
      })
    })
  })

  describe('#update', () => {
    let createdWallet: Wallet
    beforeEach(() => {
      createdWallet = walletService.create(wallet1)
    })
    it('renames wallet', () => {
      wallet1.name = 'renamed'
      walletService.update(createdWallet.id, wallet1)
      const updatedWallet = walletService.get(createdWallet.id)
      expect(updatedWallet.name).toEqual('renamed')
    })
  })

  describe('#getCurrent', () => {
    let createdWallet1: Wallet
    let createdWallet2: Wallet
    beforeEach(() => {
      createdWallet1 = walletService.create(wallet2)
      createdWallet2 = walletService.create(wallet3)
    })
    it('get all wallets', () => {
      expect(walletService.getAll().length).toBe(2)
    })

    it('get and set active wallet', () => {
      expect(() => walletService.setCurrent(createdWallet1.id)).not.toThrowError()

      let currentWallet = walletService.getCurrent()
      expect(currentWallet && currentWallet.id).toEqual(createdWallet1.id)

      expect(() => walletService.setCurrent(createdWallet2.id)).not.toThrowError()

      currentWallet = walletService.getCurrent()
      expect(currentWallet && currentWallet.id).toEqual(createdWallet2.id)
    })

    it('the last created wallet is active wallet', () => {
      const activeWallet = walletService.getCurrent()
      expect(activeWallet && activeWallet.id).toEqual(createdWallet2.id)
    })
  })

  describe('#delete', () => {
    let w1: any
    beforeEach(() => {
      w1 = walletService.create(wallet1)
    })
    it('delete wallet', async () => {
      walletService.create(wallet2)
      expect(walletService.getAll().length).toBe(2)
      await walletService.delete(w1.id)
      expect(() => walletService.get(w1.id)).toThrowError()
      expect(stubbedDeleteByWalletId).toHaveBeenCalledWith(w1.id)
      expect(stubbedDeleteByWalletId).toHaveBeenCalledTimes(1)
    })

    describe('with more than one wallets', () => {
      let w2: any
      beforeEach(() => {
        w2 = walletService.create(wallet2)
      })
      describe('when deleted current wallet', () => {
        beforeEach(async () => {
          await walletService.delete(w1.id)
        })
        it('switches active wallet', () => {
          const activeWallet = walletService.getCurrent()
          expect(activeWallet && activeWallet.id).toEqual(w2.id)
          expect(walletService.getAll().length).toEqual(1)
        })
      })
      describe('when deleted wallets other than current wallet', () => {
        beforeEach(async () => {
          await walletService.delete(w2.id)
        })
        it('should not switch active wallet', () => {
          const activeWallet = walletService.getCurrent()
          expect(activeWallet && activeWallet.id).toEqual(w1.id)
        })
      })
    })
  })

  describe('#maintainAddressesIfNecessary', () => {
    let createdWallet1: any
    let createdWallet2: any
    let createdWallet3: any
    beforeEach(async () => {
      createdWallet1 = walletService.create(wallet1)
      createdWallet2 = walletService.create(wallet2)
      createdWallet3 = walletService.create(wallet3)

      when(stubbedGetAddressesByWalletId)
        .calledWith(createdWallet1.id)
        .mockResolvedValue({ length: 1 })
        .calledWith(createdWallet2.id)
        .mockResolvedValue({ length: 0 })
        .calledWith(createdWallet3.id)
        .mockResolvedValue({ length: 0 })

      await walletService.maintainAddressesIfNecessary()
    })
    it('should not generate addresses for wallets already having addresses', () => {
      expect(stubbedGenerateAndSaveForExtendedKeyQueue).not.toHaveBeenCalledWith(createdWallet1.id)
    })
    it('generates addresses for wallets not having addresses', () => {
      expect(stubbedGenerateAndSaveForExtendedKeyQueue).toHaveBeenCalledWith({
        walletId: createdWallet2.id,
        extendedKey: expect.objectContaining({ publicKey: 'a' }),
        isImporting: false,
        receivingAddressCount: 20,
        changeAddressCount: 10,
      })
      expect(stubbedGenerateAndSaveForExtendedKeyQueue).toHaveBeenCalledWith({
        walletId: createdWallet3.id,
        extendedKey: expect.objectContaining({ publicKey: 'a' }),
        isImporting: false,
        receivingAddressCount: 20,
        changeAddressCount: 10,
      })
    })
    describe('when having invalid wallet ids in key info', () => {
      const deletedWalletId = 'wallet4'
      const generateKeyInfo = (walletId: string, pk: string) => {
        const keyInfo = new HdPublicKeyInfo()
        keyInfo.walletId = walletId
        keyInfo.publicKeyInBlake160 = pk
        keyInfo.addressType = 0
        keyInfo.addressIndex = 0
        return keyInfo
      }
      beforeEach(async () => {
        const keyInfos = [
          generateKeyInfo(deletedWalletId, 'pk1'),
          generateKeyInfo(deletedWalletId, 'pk2'),
          generateKeyInfo(createdWallet1.id, 'pk3'),
        ]
        await getConnection().manager.save(keyInfos)

        const savedKeyInfos = await getConnection().getRepository(HdPublicKeyInfo).find()
        expect(savedKeyInfos.length).toEqual(3)
        const keyInfosByDeletedWallet = savedKeyInfos.filter(key => key.walletId === deletedWalletId)
        expect(keyInfosByDeletedWallet.length).toEqual(2)

        await walletService.maintainAddressesIfNecessary()
      })
      it('deletes related key infos in hd_public_key_info table', async () => {
        const savedKeyInfos = await getConnection().getRepository(HdPublicKeyInfo).find()
        expect(savedKeyInfos.length).toEqual(1)
        const keyInfosByDeletedWallet = savedKeyInfos.filter(key => key.walletId === deletedWalletId)
        expect(keyInfosByDeletedWallet.length).toEqual(0)
      })
    })
  })

  describe('checkAndGenerateAddress', () => {
    const walletServiceMock = new WalletService()
    const getMock = jest.spyOn(walletServiceMock, 'get')
    const checkAndGenerateAddressesMock = jest.fn()
    // @ts-ignore
    getMock.mockReturnValue({ checkAndGenerateAddresses: () => checkAndGenerateAddressesMock() })

    beforeEach(() => {
      checkAndGenerateAddressesMock.mockReset()
    })
    it('no duplicate walletId', async () => {
      await walletServiceMock.checkAndGenerateAddress(['walletId1'])
      expect(checkAndGenerateAddressesMock).toHaveBeenCalledTimes(1)
    })
    it('with duplicate walletId', async () => {
      await walletServiceMock.checkAndGenerateAddress(['walletId1', 'walletId1'])
      expect(checkAndGenerateAddressesMock).toHaveBeenCalledTimes(1)
    })
  })
})

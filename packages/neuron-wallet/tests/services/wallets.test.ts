import Keystore from '../../src/models/keys/keystore'
import initConnection from '../../src/database/chain/ormconfig'
import { getConnection } from 'typeorm'
import { when } from 'jest-when'

const stubbedGetAddressesByWalletId = jest.fn()
const stubbedCheckAndGenerateSave = jest.fn()
const stubbedDeleteByWalletId = jest.fn()

jest.doMock('../../src/services/addresses', () => {
  return {
    getAddressesByWalletId: stubbedGetAddressesByWalletId,
    checkAndGenerateSave: stubbedCheckAndGenerateSave,
    deleteByWalletId: stubbedDeleteByWalletId
  }
});
import WalletService, { WalletProperties } from '../../src/services/wallets'

const resetMocks = () => {
  stubbedGetAddressesByWalletId.mockReset()
  stubbedCheckAndGenerateSave.mockReset()
}

describe('wallet service', () => {
  let walletService: WalletService

  let wallet1: WalletProperties
  let wallet2: WalletProperties
  let wallet3: WalletProperties

  beforeAll(async () => {
    await initConnection('')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    resetMocks()

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

  it('the last created wallet is active wallet', () => {
    walletService.create(wallet1)
    const w2 = walletService.create(wallet2)
    const activeWallet = walletService.getCurrent()
    expect(activeWallet && activeWallet.id).toEqual(w2.id)
  })

  describe('#delete', () => {
    let w1: any
    beforeEach(() => {
      w1 = walletService.create(wallet1)
    });
    it('delete wallet', async () => {
      walletService.create(wallet2)
      expect(walletService.getAll().length).toBe(2)
      await walletService.delete(w1.id)
      expect(() => walletService.get(w1.id)).toThrowError()
      expect(stubbedDeleteByWalletId).toHaveBeenCalledWith(w1.id)
    })

    describe('with more than one wallets', () => {
      let w2: any
      beforeEach(() => {
        w2 = walletService.create(wallet2)
      });
      describe('when deleted current wallet', () => {
        beforeEach(async () => {
          await walletService.delete(w1.id)
        });
        it('switches active wallet', () => {
          const activeWallet = walletService.getCurrent()
          expect(activeWallet && activeWallet.id).toEqual(w2.id)
          expect(walletService.getAll().length).toEqual(1)
        })
      });
      describe('when deleted wallets other than current wallet', () => {
        beforeEach(async () => {
          await walletService.delete(w2.id)
        });
        it('should not switch active wallet', () => {
          const activeWallet = walletService.getCurrent()
          expect(activeWallet && activeWallet.id).toEqual(w1.id)
        })
      });

    });
  });

  describe('#generateAddressesIfNecessary', () => {
    let createdWallet1: any
    let createdWallet2: any
    let createdWallet3: any
    beforeEach(async () => {
      createdWallet1 = walletService.create(wallet1)
      createdWallet2 = walletService.create(wallet2)
      createdWallet3 = walletService.create(wallet3)

      when(stubbedGetAddressesByWalletId)
        .calledWith(createdWallet1.id).mockResolvedValue({length: 1})
        .calledWith(createdWallet2.id).mockResolvedValue({length: 0})
        .calledWith(createdWallet3.id).mockResolvedValue({length: 0})

      await walletService.generateAddressesIfNecessary()
    });
    it('should not generate addresses for wallets already having addresses', () => {
      expect(stubbedCheckAndGenerateSave).not.toHaveBeenCalledWith(createdWallet1.id)
    })
    it('generates addresses for wallets not having addresses', () => {
      expect(stubbedCheckAndGenerateSave).toHaveBeenCalledWith(
        createdWallet2.id,
        expect.objectContaining({publicKey: ''}),
        false,
        20,
        10,
        false
      )
      expect(stubbedCheckAndGenerateSave).toHaveBeenCalledWith(
        createdWallet3.id,
        expect.objectContaining({publicKey: ''}),
        false,
        20,
        10,
        false
      )
    });
  });
})

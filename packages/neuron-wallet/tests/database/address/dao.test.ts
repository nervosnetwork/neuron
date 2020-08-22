import { AddressType } from '../../../src/models/keys/address'
import AddressDao, { Address, AddressVersion } from '../../../src/database/address/address-dao'
import HdPublicKeyInfo from '../../../src/database/chain/entities/hd-public-key-info'
import { getConnection } from 'typeorm'
import { initConnection } from '../../../src/database/chain/ormconfig'

describe('Address Dao tests', () => {
  const address: Address = {
    walletId: '1',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    path: "m/44'/309'/0'/0/0",
    addressType: AddressType.Receiving,
    addressIndex: 0,
    txCount: 0,
    liveBalance: '0',
    sentBalance: '0',
    pendingBalance: '0',
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
    version: AddressVersion.Testnet,
  }

  const address2: Address = {
    walletId: '1',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu84',
    path: "m/44'/309'/0'/0/1",
    addressType: AddressType.Receiving,
    addressIndex: 1,
    txCount: 0,
    liveBalance: '0',
    sentBalance: '0',
    pendingBalance: '0',
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4d',
    version: AddressVersion.Testnet,
  }

  const usedAddress: Address = {
    walletId: '2',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu85',
    path: "m/44'/309'/0'/0/0",
    addressType: AddressType.Receiving,
    addressIndex: 0,
    txCount: 1,
    liveBalance: '0',
    sentBalance: '0',
    pendingBalance: '0',
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4e',
    version: AddressVersion.Testnet,
  }

  const addresses = [address, address2, usedAddress]

  beforeAll(async () => {
    await initConnection('')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    await AddressDao.create(addresses)
  })

  describe('#create', () => {
    it('saves the newly added address', async () => {
      const publicKeyInfos = await getConnection()
        .getRepository(HdPublicKeyInfo)
        .find()

      expect(publicKeyInfos.length).toEqual(3)
      for (const publicKeyInfo of publicKeyInfos) {
        const address = addresses.find(addr => addr.address === publicKeyInfo.address)
        expect(publicKeyInfo.address).toEqual(address!.address)
        expect(publicKeyInfo.publicKeyInBlake160).toEqual(address!.blake160)
      }
    })
  });

  describe('#allAddressesByWalletId', () => {
    let result: HdPublicKeyInfo[]
    describe('when exists', () => {
      beforeEach(async () => {
        const walletId = '1'
        result = await AddressDao.allAddressesByWalletId(walletId)
      });
      it('returns addresses', () => {
        expect(result.length).toEqual(2)
        expect(result[0].walletId).toEqual('1')
        expect(result[1].walletId).toEqual('1')
      });
    });
    describe('when not exists', () => {
      beforeEach(async () => {
        const walletId = '3'
        result = await AddressDao.allAddressesByWalletId(walletId)
      });
      it('returns empty array', () => {
        expect(result).toEqual([])
      });
    });
  });
  describe('#updateDescription', () => {
    const description = 'desc'
    const addressToUpdate = address
    let publicKeyInfos: HdPublicKeyInfo[]
    beforeEach(async () => {
      await AddressDao.updateDescription(addressToUpdate.walletId, addressToUpdate.address, description)
      publicKeyInfos = await AddressDao.allAddressesByWalletId(addressToUpdate.walletId)
    });
    it('saves description for a public key info matching with the address', () => {
      const updatedPublicKeyInfo = publicKeyInfos.find((publicKeyInfo: any) => publicKeyInfo.address === addressToUpdate.address)
      expect(updatedPublicKeyInfo!.description).toEqual(description)

      const otherPublicKeyInfo = publicKeyInfos.find((publicKeyInfo: any) => publicKeyInfo.address === address2.address)
      expect(otherPublicKeyInfo!.description).toEqual(null)
    })
  });
  describe('#deleteByWalletId', () => {
    const walletId = '1'
    beforeEach(async () => {
      const publicKeyInfosByWalletId = await AddressDao.allAddressesByWalletId(walletId)
      expect(publicKeyInfosByWalletId.length).toEqual(2)
      await AddressDao.deleteByWalletId(walletId)
    });
    it('removes all public key infos of a wallet id', async () => {
      const publicKeyInfosByWalletId = await AddressDao.allAddressesByWalletId(walletId)
      expect(publicKeyInfosByWalletId).toEqual([])
    });
  });

})

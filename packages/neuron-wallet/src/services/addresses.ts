import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { AccountExtendedPublicKey } from '../keys/key'
import Address, { AddressType } from '../keys/address'
import LockUtils from '../utils/lock-utils'
import AddressDao, { Address as AddressInterface } from '../addresses/dao'
import env from '../env'
import { AddressVersion } from '../addresses/entities/address'
import AddressesUsedSubject from '../subjects/addresses-used-subject'

const MAX_ADDRESS_COUNT = 30

export interface AddressMetaInfo {
  walletId: string
  addressType: AddressType
  addressIndex: number
  accountExtendedPublicKey: AccountExtendedPublicKey
}

export default class AddressService {
  public static isAddressUsed = async (address: string, walletId: string): Promise<boolean> => {
    const addressEntity = await AddressDao.findByAddress(address, walletId)
    return !!addressEntity
  }

  public static generateAndSave = async (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    const addresses = AddressService.generateAddresses(walletId, extendedKey, receivingAddressCount, changeAddressCount)
    const allAddresses = [
      ...addresses.testnetReceiving,
      ...addresses.mainnetReceiving,
      ...addresses.testnetChange,
      ...addresses.mainnetChange,
    ]
    await AddressDao.create(allAddresses)
  }

  /* eslint no-await-in-loop: "off" */
  /* eslint no-restricted-syntax: "off" */
  public static updateTxCountAndBalances = async (addresses: string[]) => {
    for (const address of addresses) {
      await AddressDao.updateTxCountAndBalance(address)
    }
  }

  // Generate both receiving and change addresses.
  public static generateAddresses = (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    if (receivingAddressCount < 1 || changeAddressCount < 1) {
      throw new Error('Address number error.')
    } else if (receivingAddressCount > MAX_ADDRESS_COUNT || changeAddressCount > MAX_ADDRESS_COUNT) {
      throw new Error('Address number error.')
    }
    const receiving = Array.from({ length: receivingAddressCount }).map((_, idx) => {
      // extendedKey.address(AddressType.Receiving, idx)
      const addressMetaInfo: AddressMetaInfo = {
        walletId,
        addressType: AddressType.Receiving,
        addressIndex: idx,
        accountExtendedPublicKey: extendedKey,
      }
      return AddressService.toAddress(addressMetaInfo)
    })
    const testnetReceiving = receiving.map(arr => arr[0])
    const mainnetReceiving = receiving.map(arr => arr[1])
    const change = Array.from({ length: changeAddressCount }).map((_, idx) => {
      // extendedKey.address(AddressType.Change, idx)
      const addressMetaInfo: AddressMetaInfo = {
        walletId,
        addressType: AddressType.Change,
        addressIndex: idx,
        accountExtendedPublicKey: extendedKey,
      }
      return AddressService.toAddress(addressMetaInfo)
    })
    const testnetChange = change.map(arr => arr[0])
    const mainnetChange = change.map(arr => arr[1])
    return {
      testnetReceiving,
      mainnetReceiving,
      testnetChange,
      mainnetChange,
    }
  }

  private static toAddress = (addressMetaInfo: AddressMetaInfo) => {
    const path: string = Address.pathFor(addressMetaInfo.addressType, addressMetaInfo.addressIndex)
    const testnetAddress: string = addressMetaInfo.accountExtendedPublicKey.address(
      addressMetaInfo.addressType,
      addressMetaInfo.addressIndex,
      AddressPrefix.Testnet
    ).address

    const mainnetAddress: string = addressMetaInfo.accountExtendedPublicKey.address(
      addressMetaInfo.addressType,
      addressMetaInfo.addressIndex,
      AddressPrefix.Mainnet
    ).address

    const blake160: string = LockUtils.addressToBlake160(testnetAddress)

    const testnetAddressInfo = {
      walletId: addressMetaInfo.walletId,
      address: testnetAddress,
      path,
      addressType: addressMetaInfo.addressType,
      addressIndex: addressMetaInfo.addressIndex,
      txCount: 0,
      balance: '0',
      blake160,
      version: AddressVersion.Testnet,
    }

    const mainnetAddressInfo = {
      ...testnetAddressInfo,
      address: mainnetAddress,
      version: AddressVersion.Mainnet,
    }

    return [testnetAddressInfo, mainnetAddressInfo]
  }

  public static nextUnusedAddress = async (walletId: string): Promise<AddressInterface | undefined> => {
    const version = AddressService.getAddressVersion()

    const addressEntity = await AddressDao.nextUnusedAddress(walletId, version)
    if (!addressEntity) {
      return undefined
    }
    return addressEntity.toInterface()
  }

  public static nextUnusedChangeAddress = async (walletId: string): Promise<AddressInterface | undefined> => {
    const version = AddressService.getAddressVersion()

    const addressEntity = await AddressDao.nextUnusedChangeAddress(walletId, version)
    if (!addressEntity) {
      return undefined
    }
    return addressEntity.toInterface()
  }

  public static allAddresses = async (): Promise<AddressInterface[]> => {
    const version = AddressService.getAddressVersion()

    const addressEntities = await AddressDao.allAddresses(version)

    return addressEntities.map(addr => addr.toInterface())
  }

  public static allAddressesByWalletId = async (walletId: string): Promise<AddressInterface[]> => {
    const version = AddressService.getAddressVersion()
    const addressEntities = await AddressDao.allAddressesByWalletId(walletId, version)

    return addressEntities.map(addr => addr.toInterface())
  }

  public static usedAddresses = async (walletId: string): Promise<AddressInterface[]> => {
    const version = AddressService.getAddressVersion()
    const addressEntities = await AddressDao.usedAddressesByWalletId(walletId, version)

    return addressEntities.map(addr => addr.toInterface())
  }

  private static getAddressVersion = (): AddressVersion => {
    return env.testnet ? AddressVersion.Testnet : AddressVersion.Mainnet
  }
}

// update txCount when addresses used
const addressUsedSubject = AddressesUsedSubject.getSubject()
addressUsedSubject.subscribe(async (addresses: string[]) => {
  await AddressService.updateTxCountAndBalances(addresses)
})

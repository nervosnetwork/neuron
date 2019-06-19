import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { AccountExtendedPublicKey } from '../keys/key'
import Address, { AddressType } from '../keys/address'
import LockUtils from '../utils/lock-utils'
import AddressDao, { Address as AddressInterface } from '../addresses/dao'
import env from '../env'
import { AddressVersion } from '../addresses/entities/address'

const MAX_ADDRESS_COUNT = 30
// const SEARCH_RANGE = 20

export interface AddressMetaInfo {
  walletId: string
  addressType: AddressType
  addressIndex: number
  accountExtendedPublicKey: AccountExtendedPublicKey
}

export default class AddressService {
  public static isAddressUsed = async (address: string): Promise<boolean> => {
    const addressEntity = await AddressDao.findByAddress(address)
    if (!addressEntity) {
      return false
    }
    return true
  }

  public static generateAndSave = async (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    const addresses = AddressService.generateAddresses(walletId, extendedKey, receivingAddressCount, changeAddressCount)
    const allAddresses = [...addresses.receiving, ...addresses.change]
    await AddressDao.create(allAddresses)
  }

  // Generate both receiving and change addresses.
  private static generateAddresses = (
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
    const receiving = Array.from({ length: receivingAddressCount })
      .map((_, idx) => {
        // extendedKey.address(AddressType.Receiving, idx)
        const addressMetaInfo: AddressMetaInfo = {
          walletId,
          addressType: AddressType.Receiving,
          addressIndex: idx,
          accountExtendedPublicKey: extendedKey,
        }
        return AddressService.toAddress(addressMetaInfo)
      })
      .flat()
    const change = Array.from({ length: changeAddressCount })
      .map((_, idx) => {
        // extendedKey.address(AddressType.Change, idx)
        const addressMetaInfo: AddressMetaInfo = {
          walletId,
          addressType: AddressType.Change,
          addressIndex: idx,
          accountExtendedPublicKey: extendedKey,
        }
        return AddressService.toAddress(addressMetaInfo)
      })
      .flat()
    return {
      receiving,
      change,
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

  public static allAddresses = async (): Promise<AddressInterface[]> => {
    const version = AddressService.getAddressVersion()

    const addressEntities = await AddressDao.allAddresses(version)

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

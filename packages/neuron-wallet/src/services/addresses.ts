import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { AccountExtendedPublicKey } from 'models/keys/key'
import Address, { AddressType } from 'models/keys/address'
import LockUtils from 'models/lock-utils'
import AddressDao, { Address as AddressInterface, AddressVersion } from 'database/address/address-dao'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import NodeService from './node'
import NetworksService from 'services/networks'

const MAX_ADDRESS_COUNT = 30

export interface AddressMetaInfo {
  walletId: string
  addressType: AddressType
  addressIndex: number
  accountExtendedPublicKey: AccountExtendedPublicKey
}

export default class AddressService {
  public static generateAndSave = (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    isImporting: boolean | undefined,
    receivingStartIndex: number,
    changeStartIndex: number,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    const addresses = AddressService.generateAddresses(
      walletId,
      extendedKey,
      receivingStartIndex,
      changeStartIndex,
      receivingAddressCount,
      changeAddressCount
    )
    const allAddresses: AddressInterface[] = [
      ...addresses.testnetReceiving,
      ...addresses.mainnetReceiving,
      ...addresses.testnetChange,
      ...addresses.mainnetChange,
    ]
    AddressDao.create(allAddresses)

    // TODO: notify address created and pass addressWay
    AddressService.notifyAddressCreated(allAddresses, isImporting)
  }

  private static notifyAddressCreated = (addresses: AddressInterface[], isImporting: boolean | undefined) => {
    const addrs = addresses
      .filter(addr => addr.version ===  AddressService.getAddressVersion())
      .map(addr => {
        const address = addr
        address.isImporting = isImporting
        return address
      })
    AddressCreatedSubject.getSubject().next(addrs)
  }

  public static checkAndGenerateSave = (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    isImporting: boolean | undefined,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    const addressVersion = AddressService.getAddressVersion()
    const [unusedReceivingCount, unusedChangeCount] = AddressDao.unusedAddressesCount(walletId, addressVersion)
    if (
      unusedReceivingCount > 3 &&
      unusedChangeCount > 3
    ) {
      return undefined
    }
    const maxIndexReceivingAddress = AddressDao.maxAddressIndex(walletId, AddressType.Receiving, addressVersion)
    const maxIndexChangeAddress = AddressDao.maxAddressIndex(walletId, AddressType.Change, addressVersion)
    const nextReceivingIndex = maxIndexReceivingAddress === undefined ? 0 : maxIndexReceivingAddress.addressIndex + 1
    const nextChangeIndex = maxIndexChangeAddress === undefined ? 0 : maxIndexChangeAddress.addressIndex + 1
    return AddressService.generateAndSave(
      walletId,
      extendedKey,
      isImporting,
      nextReceivingIndex,
      nextChangeIndex,
      receivingAddressCount,
      changeAddressCount
    )
  }

  public static updateTxCountAndBalances = async (addresses: string[], url: string = NodeService.getInstance().core.rpc.node.url) => {
    let result: Address[] = []
    for (const address of addresses) {
      const updatedAddress = await AddressDao.updateTxCountAndBalance(address, url)
      result = result.concat(updatedAddress)
    }
    return result
  }

  // Generate both receiving and change addresses.
  public static generateAddresses = (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    receivingStartIndex: number,
    changeStartIndex: number,
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
        addressIndex: idx + receivingStartIndex,
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
        addressIndex: idx + changeStartIndex,
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

  private static toAddress = (addressMetaInfo: AddressMetaInfo): AddressInterface[] => {
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

    const addressToParse = NetworksService.getInstance().isMainnet() ? mainnetAddress : testnetAddress
    const blake160: string = LockUtils.addressToBlake160(addressToParse)

    const testnetAddressInfo: AddressInterface = {
      walletId: addressMetaInfo.walletId,
      address: testnetAddress,
      path,
      addressType: addressMetaInfo.addressType,
      addressIndex: addressMetaInfo.addressIndex,
      txCount: 0,
      liveBalance: '0',
      sentBalance: '0',
      pendingBalance: '0',
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

  public static nextUnusedAddress = (walletId: string): AddressInterface | undefined => {
    const addressEntity = AddressDao.nextUnusedAddress(walletId,  AddressService.getAddressVersion())
    if (!addressEntity) {
      return undefined
    }
    return addressEntity
  }

  public static nextUnusedChangeAddress = (walletId: string): AddressInterface | undefined => {
    const addressEntity = AddressDao.nextUnusedChangeAddress(walletId,  AddressService.getAddressVersion())
    if (!addressEntity) {
      return undefined
    }
    return addressEntity
  }

  public static allAddresses = (): AddressInterface[] => {
    return AddressDao.allAddresses( AddressService.getAddressVersion())
  }

  public static allAddressesByWalletId = (walletId: string): AddressInterface[] => {
    return AddressDao.allAddressesByWalletId(walletId,  AddressService.getAddressVersion())
  }

  public static usedAddresses = (walletId: string): AddressInterface[] => {
    return AddressDao.usedAddressesByWalletId(walletId,  AddressService.getAddressVersion())
  }

  public static updateDescription = (walletId: string, address: string, description: string): AddressInterface | undefined => {
    return AddressDao.updateDescription(walletId, address, description)
  }

  public static deleteByWalletId = (walletId: string): AddressInterface[] => {
    return AddressDao.deleteByWalletId(walletId)
  }

  public static findByAddresses = (addresses: string[]): AddressInterface[] => {
    return AddressDao.findByAddresses(addresses)
  }

  private static getAddressVersion = (): AddressVersion => {
    return NetworksService.getInstance().isMainnet() ? AddressVersion.Mainnet : AddressVersion.Testnet
  }
}

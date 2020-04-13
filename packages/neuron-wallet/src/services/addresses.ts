import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { AccountExtendedPublicKey, DefaultAddressNumber } from 'models/keys/key'
import Address, { AddressType } from 'models/keys/address'
import AddressDao, { Address as AddressInterface, AddressVersion } from 'database/address/address-dao'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import NetworksService from 'services/networks'
import AddressParser from 'models/address-parser'

const MAX_ADDRESS_COUNT = 100

export interface AddressMetaInfo {
  walletId: string
  addressType: AddressType
  addressIndex: number
  accountExtendedPublicKey: AccountExtendedPublicKey
}

export default class AddressService {
  // <= 3
  private static minUnusedAddressCount: number = 3

  public static generateAndSave = (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    isImporting: boolean | undefined,
    receivingStartIndex: number,
    changeStartIndex: number,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change
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
      ...addresses.mainnetReceiving,
      ...addresses.mainnetChange,
      ...addresses.testnetReceiving,
      ...addresses.testnetChange,
    ]
    AddressDao.create(allAddresses)

    AddressService.notifyAddressCreated(allAddresses, isImporting)
  }

  private static notifyAddressCreated = (addresses: AddressInterface[], isImporting: boolean | undefined) => {
    const versionFilter = ((a: AddressInterface) => { return a.version === AddressService.getAddressVersion() })

    // If first receiving address already exists in other wallets, treat as none importing.
    // This assumes addresses.first is the actual first address.
    const firstAddress = addresses.filter(versionFilter)[0]
    const alreadyExist = AddressDao.findByAddresses([firstAddress.address]).length > 1
    const importing = isImporting && !alreadyExist

    const addressesToNotify = addresses
      .filter(versionFilter)
      .map(address => { return { ...address, isImporting: importing } })
    AddressCreatedSubject.getSubject().next(addressesToNotify)
  }

  public static checkAndGenerateSave(
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    isImporting: boolean | undefined,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change
  ) {
    const addressVersion = AddressService.getAddressVersion()
    const [unusedReceivingCount, unusedChangeCount] = AddressDao.unusedAddressesCount(walletId, addressVersion)
    if (
      unusedReceivingCount > this.minUnusedAddressCount &&
      unusedChangeCount > this.minUnusedAddressCount
    ) {
      return undefined
    }
    const maxIndexReceivingAddress = AddressDao.maxAddressIndex(walletId, AddressType.Receiving, addressVersion)
    const maxIndexChangeAddress = AddressDao.maxAddressIndex(walletId, AddressType.Change, addressVersion)
    const nextReceivingIndex = maxIndexReceivingAddress === undefined ? 0 : maxIndexReceivingAddress.addressIndex + 1
    const nextChangeIndex = maxIndexChangeAddress === undefined ? 0 : maxIndexChangeAddress.addressIndex + 1

    const receivingCount: number = unusedReceivingCount > this.minUnusedAddressCount ? 0 : receivingAddressCount
    const changeCount: number = unusedChangeCount > this.minUnusedAddressCount ? 0 : changeAddressCount
    return AddressService.generateAndSave(
      walletId,
      extendedKey,
      isImporting,
      nextReceivingIndex,
      nextChangeIndex,
      receivingCount,
      changeCount
    )
  }

  public static async updateTxCountAndBalances(addresses: string[]): Promise<AddressInterface[]> {
    return AddressDao.updateTxCountAndBalances(addresses)
  }

  // Generate both receiving and change addresses.
  public static generateAddresses = (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    receivingStartIndex: number,
    changeStartIndex: number,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change
  ) => {
    // can be only receiving OR only change
    if (receivingAddressCount < 1 && changeAddressCount < 1) {
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
    const blake160: string = AddressParser.toBlake160(addressToParse)

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

  public static allAddressesByWalletId = (
    walletId: string,
    addressVersion: AddressVersion = AddressService.getAddressVersion()
  ): AddressInterface[] => {
    return AddressDao.allAddressesByWalletId(walletId, addressVersion)
  }

  public static allLockHashes(): string[] {
    const addresses = AddressService.allAddresses().map(address => address.address)
    return AddressParser.batchToLockHash(addresses)
  }

  public static allLockHashesByWalletId(walletId: string): string[] {
    const addresses = AddressService.allAddressesByWalletId(walletId).map(addr => addr.address)
    return AddressParser.batchToLockHash(addresses)
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

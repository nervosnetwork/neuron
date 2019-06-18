import TransactionsService from './transactions'
import WalletService from './wallets'
import { AccountExtendedPublicKey } from '../keys/key'
import Address, { AddressType } from '../keys/address'

const MAX_ADDRESS_COUNT = 30
const SEARCH_RANGE = 20

export default class AddressService {
  public static isAddressUsed = (address: string) => TransactionsService.hasTransactions(address)

  public static nextUnusedAddress = (extendedKey: AccountExtendedPublicKey) => {
    const nextUnusedIndex = AddressService.searchAddressIndex(extendedKey, SEARCH_RANGE)
    return extendedKey.address(AddressType.Receiving, nextUnusedIndex)
  }

  // Generate both receiving and change addresses.
  public static generateAddresses = (
    extendedKey: AccountExtendedPublicKey,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    if (receivingAddressCount < 1 || changeAddressCount < 1) {
      throw new Error('Address number error.')
    } else if (receivingAddressCount > MAX_ADDRESS_COUNT || changeAddressCount > MAX_ADDRESS_COUNT) {
      throw new Error('Address number error.')
    }
    const receiving = Array.from({ length: receivingAddressCount }).map((_, idx) =>
      extendedKey.address(AddressType.Receiving, idx)
    )
    const change = Array.from({ length: changeAddressCount }).map((_, idx) =>
      extendedKey.address(AddressType.Change, idx)
    )
    return {
      receiving,
      change,
    }
  }

  public static allAddresses = () =>
    WalletService.getInstance()
      .getAll()
      .reduce((total: Address[], cur) => {
        return [...total, ...cur.addresses.change, ...cur.addresses.receiving]
      }, [])

  public static searchUsedAddresses = (extendedKey: AccountExtendedPublicKey) =>
    Array.from({ length: AddressService.searchAddressIndex(extendedKey) }, (_, idx) => {
      const address = extendedKey.address(AddressType.Receiving, idx)
      if (AddressService.isAddressUsed(address.address)) {
        return null
      }
      return address
    }).filter(addr => addr) as Address[]

  // TODO: refactor me
  public static searchAddressIndex = (
    extendedKey: AccountExtendedPublicKey,
    startIndex = 0,
    maxUsedIndex = 0,
    minUnusedIndex = 100,
    depth = 0
  ): any => {
    if (depth >= 10) {
      return maxUsedIndex + 1
    }

    const startAddress = extendedKey.address(AddressType.Receiving, startIndex)
    if (!AddressService.isAddressUsed(startAddress.address)) {
      if (startIndex === 0) {
        return 0
      }
      return AddressService.searchAddressIndex(
        extendedKey,
        Math.floor((startIndex - maxUsedIndex) / 2 + maxUsedIndex),
        maxUsedIndex,
        Math.min(minUnusedIndex, startIndex),
        depth + 1
      )
    }

    const nextAddress = extendedKey.address(AddressType.Receiving, startIndex + 1)
    if (!AddressService.isAddressUsed(nextAddress.address)) {
      return startIndex + 1
    }

    return AddressService.searchAddressIndex(
      extendedKey,
      Math.round((minUnusedIndex - startIndex) / 2 + startIndex),
      Math.max(maxUsedIndex, startIndex),
      minUnusedIndex,
      depth + 1
    )
  }
}

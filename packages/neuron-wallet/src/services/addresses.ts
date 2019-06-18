import TransactionsService from './transactions'
import WalletService from './wallets'
import { ExtendedPublicKey } from '../keys/key'
import Address, { AddressType, publicKeyToAddress } from '../keys/address'

const MAX_ADDRESS_COUNT = 30
const SEARCH_RANGE = 20

class AddressService {
  public static isAddressUsed = (address: string) => TransactionsService.hasTransactions(address)

  public static addressFromHDIndex = (extendedKey: ExtendedPublicKey, index: number, type = AddressType.Receiving) =>
    publicKeyToAddress(Address.keyFromExtendedPublicKey(extendedKey, type, index).publicKey)

  public static nextUnusedAddress = (extendedKey: ExtendedPublicKey) => {
    const nextUnusedIndex = AddressService.searchHDIndex(extendedKey, SEARCH_RANGE)
    const { publicKey } = Address.keyFromExtendedPublicKey(extendedKey, AddressType.Receiving, nextUnusedIndex)
    return publicKeyToAddress(publicKey)
  }

  // Generate both receiving and change addresses.
  // m/44'/309'/0' is the fixed path for the extended public key.
  public static generateAddresses = (
    extendedKey: ExtendedPublicKey,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    if (receivingAddressCount < 1 || changeAddressCount < 1) {
      throw new Error('Address number error.')
    } else if (receivingAddressCount > MAX_ADDRESS_COUNT || changeAddressCount > MAX_ADDRESS_COUNT) {
      throw new Error('Address number error.')
    }
    const receiving = Array.from({ length: receivingAddressCount }).map((_, idx) => ({
      address: AddressService.addressFromHDIndex(extendedKey, idx, AddressType.Receiving),
      path: Address.pathForReceiving(idx),
    }))
    const change = Array.from({ length: changeAddressCount }).map((_, idx) => ({
      address: AddressService.addressFromHDIndex(extendedKey, idx, AddressType.Change),
      path: Address.pathForChange(idx),
    }))
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

  public static searchUsedAddresses = (extendedKey: ExtendedPublicKey) =>
    Array.from({ length: AddressService.searchHDIndex(extendedKey) }, (_, idx) => {
      const { publicKey, path } = Address.keyFromExtendedPublicKey(extendedKey, AddressType.Receiving, idx)
      if (!publicKey) return null
      const address = publicKeyToAddress(publicKey)
      if (AddressService.isAddressUsed(address)) return null
      return {
        path,
        address,
      }
    }).filter(addr => addr) as Address[]

  // TODO: refactor me
  public static searchHDIndex = (
    extendedKey: ExtendedPublicKey,
    startIndex = 0,
    maxUsedIndex = 0,
    minUnusedIndex = 100,
    depth = 0
  ): any => {
    if (depth >= 10) return maxUsedIndex + 1
    if (!AddressService.isAddressUsed(AddressService.addressFromHDIndex(extendedKey, startIndex))) {
      if (startIndex === 0) {
        return 0
      }
      return AddressService.searchHDIndex(
        extendedKey,
        Math.floor((startIndex - maxUsedIndex) / 2 + maxUsedIndex),
        maxUsedIndex,
        Math.min(minUnusedIndex, startIndex),
        depth + 1
      )
    }
    if (!AddressService.isAddressUsed(AddressService.addressFromHDIndex(extendedKey, startIndex + 1))) {
      return startIndex + 1
    }
    return AddressService.searchHDIndex(
      extendedKey,
      Math.round((minUnusedIndex - startIndex) / 2 + startIndex),
      Math.max(maxUsedIndex, startIndex),
      minUnusedIndex,
      depth + 1
    )
  }
}

export default AddressService

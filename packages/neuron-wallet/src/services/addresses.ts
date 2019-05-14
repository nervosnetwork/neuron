import TransactionsService from './transactions'
import WalletService from './wallets'
import nodeService from '../startup/nodeService'
import HD from '../keys/hd'
import { KeysData } from '../keys/keystore'

const {
  utils: { AddressPrefix, AddressType: Type, AddressBinIdx, pubkeyToAddress },
} = nodeService.core

export const MAX_ADDRESS_COUNT = 30
export const SEARCH_RANGE = 20

export enum AddressType {
  Receiving = 0, // External chain
  Change = 1, // Internal chain
}

export interface HDAddress {
  address: string
  path: string
}

class Address {
  public static isAddressUsed = (address: string) => TransactionsService.hasTransactions(address)

  public static addressFromPublicKey = (publicKey: string, prefix = AddressPrefix.Testnet) =>
    pubkeyToAddress(publicKey, {
      prefix,
      type: Type.BinIdx,
      binIdx: AddressBinIdx.P2PH,
    })

  public static addressFromHDIndex = (keysData: KeysData, index: number, type = AddressType.Receiving) =>
    Address.addressFromPublicKey(HD.keyFromHDIndex(keysData, index, type).publicKey)

  public static nextUnusedAddress = (keysData: KeysData) => {
    const nextUnusedIndex = Address.searchHDIndex(keysData, SEARCH_RANGE)
    const { publicKey } = HD.keyFromHDIndex(keysData, nextUnusedIndex, AddressType.Receiving)
    return Address.addressFromPublicKey(publicKey)
  }

  // Generate both receiving and change addresses
  public static generateAddresses = (
    keysData: KeysData,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10,
  ) => {
    if (receivingAddressCount < 1 || changeAddressCount < 1) {
      throw new Error('Address number error.')
    } else if (receivingAddressCount > MAX_ADDRESS_COUNT || changeAddressCount > MAX_ADDRESS_COUNT) {
      throw new Error('Address number error.')
    }
    const receiving = Array.from({ length: receivingAddressCount }).map((_, idx) => ({
      address: Address.addressFromHDIndex(keysData, idx, AddressType.Receiving),
      path: HD.pathFromIndex(AddressType.Receiving, idx),
    }))
    const change = Array.from({ length: changeAddressCount }).map((_, idx) => ({
      address: Address.addressFromHDIndex(keysData, idx, AddressType.Change),
      path: HD.pathFromIndex(AddressType.Change, idx),
    }))
    return {
      receiving,
      change,
    }
  }

  public static allAddresses = () =>
    new WalletService().getAll().reduce((total: HDAddress[], cur) => {
      return [...total, ...cur.addresses.change, ...cur.addresses.receiving]
    }, [])

  public static searchUsedAddresses = (keysData: KeysData) =>
    Array.from({ length: Address.searchHDIndex(keysData) })
      .map((_, idx) => {
        const { publicKey, path } = HD.keyFromHDIndex(keysData, idx)
        if (!publicKey) return null
        const address = Address.addressFromPublicKey(publicKey)
        if (Address.isAddressUsed(address)) return null
        return {
          path,
          address,
        }
      })
      .filter(addr => addr)

  // TODO: refactor me
  public static searchHDIndex = (
    keysData: KeysData,
    startIndex = 0,
    maxUsedIndex = 0,
    minUnusedIndex = 100,
    depth = 0,
  ): any => {
    if (depth >= 10) return maxUsedIndex + 1
    if (!Address.isAddressUsed(Address.addressFromHDIndex(keysData, startIndex))) {
      if (startIndex === 0) {
        return 0
      }
      return Address.searchHDIndex(
        keysData,
        Math.floor((startIndex - maxUsedIndex) / 2 + maxUsedIndex),
        maxUsedIndex,
        Math.min(minUnusedIndex, startIndex),
        depth + 1,
      )
    }
    if (!Address.isAddressUsed(Address.addressFromHDIndex(keysData, startIndex + 1))) {
      return startIndex + 1
    }
    return Address.searchHDIndex(
      keysData,
      Math.round((minUnusedIndex - startIndex) / 2 + startIndex),
      Math.max(maxUsedIndex, startIndex),
      minUnusedIndex,
      depth + 1,
    )
  }
}

export default Address

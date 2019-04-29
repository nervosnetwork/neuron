import TransactionsService from '../services/transactions'
import ckbCore from '../core'
import AddressType from './type'
import HD from '../keys/hd'
import { KeysData } from '../keys/keystore'

const MAX_ADDRESS_COUNT = 30

export interface HDAddress {
  address: string
  path: string
}

class Address {
  public static isAddressUsed = (address: string) => {
    return TransactionsService.hasTransactions(address)
  }

  public static addressFromPrivateKey = (privateKey: string) => {
    const account = ckbCore.wallet.accountFromPrivateKey(Buffer.from(ckbCore.utils.hexToBytes(privateKey)))
    return Address.addressFromPublicKey(account.hexPubKey)
  }

  public static addressFromPublicKey = (publicKey: string) => {
    return ckbCore.utils.pubkeyToAddress(publicKey)
  }

  public static addressFromHDIndex = (keysData: KeysData, index: number, type = AddressType.Receiving) => {
    const { privateKey } = HD.keyFromHDIndex(keysData, index, type)
    return Address.addressFromPrivateKey(privateKey)
  }

  public static nextUnusedAddress = (keysData: KeysData) => {
    const nextUnusedIndex = Address.searchHDIndex(keysData, 20)
    const { privateKey } = HD.keyFromHDIndex(keysData, nextUnusedIndex, AddressType.Receiving)
    return Address.addressFromPrivateKey(privateKey)
  }

  // Generate both receiving and change addresses
  public static generateAddresses = (keysData: KeysData, receivingAddressCount: number, changeAddressCount: number) => {
    if (receivingAddressCount < 1 || changeAddressCount < 1) {
      throw new Error('Address number error.')
    } else if (receivingAddressCount > MAX_ADDRESS_COUNT || changeAddressCount > MAX_ADDRESS_COUNT) {
      throw new Error('Address number error.')
    }
    const receivingAddresses: HDAddress[] = []
    const changeAddresses: HDAddress[] = []
    for (let index = 0; index < receivingAddressCount; index++) {
      receivingAddresses.push({
        address: Address.addressFromHDIndex(keysData, index, AddressType.Receiving),
        path: HD.pathFromIndex(AddressType.Receiving, index),
      })
    }
    for (let index = 0; index < changeAddressCount; index++) {
      changeAddresses.push({
        address: Address.addressFromHDIndex(keysData, index, AddressType.Change),
        path: HD.pathFromIndex(AddressType.Change, index),
      })
    }
    return {
      receiving: receivingAddresses,
      change: changeAddresses,
    }
  }

  public static searchUsedAddresses = (keysData: KeysData) => {
    const addresses: HDAddress[] = []
    const nextUnusedIndex = Address.searchHDIndex(keysData)
    for (let index = 0; index < nextUnusedIndex; index++) {
      const { publicKey, path } = HD.keyFromHDIndex(keysData, index)
      if (publicKey) {
        const address = Address.addressFromPrivateKey(publicKey)
        if (Address.isAddressUsed(address)) {
          addresses.push({
            path,
            address,
          })
        }
      } else {
        throw new Error('Empty private key')
      }
    }
    return addresses
  }

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

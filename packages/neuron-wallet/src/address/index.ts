import TransactionsService from '../services/transactions'
import ckbCore from '../core'
import AddressType from './type'
import HD from '../keys/hd'
import { KeysData } from '../keys/keystore'

const MaxAddressNumber = 30

export interface HDAddress {
  address: string
  path: string
}

class Address {
  public static isUsedAddress = (address: string) => {
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

  public static latestUnusedAddress = (keysData: KeysData) => {
    const latestUnusedIndex = Address.searchAddress(keysData, 20)
    const { privateKey } = HD.keyFromHDIndex(keysData, latestUnusedIndex, AddressType.Receiving)
    return Address.addressFromPrivateKey(privateKey)
  }

  // Generate both receiving and change addresses
  public static generateAddresses = (
    keysData: KeysData,
    receivingAddressNumber: number,
    changeAddressNumber: number,
  ) => {
    if (receivingAddressNumber < 1 || changeAddressNumber < 1) {
      throw new Error('Address number error.')
    } else if (receivingAddressNumber > MaxAddressNumber || changeAddressNumber > MaxAddressNumber) {
      throw new Error('Address number error.')
    }
    const receivingAddresses: HDAddress[] = []
    const changeAddresses: HDAddress[] = []
    for (let index = 0; index < receivingAddressNumber; index++) {
      receivingAddresses.push({
        address: Address.addressFromHDIndex(keysData, index, AddressType.Receiving),
        path: HD.pathFromIndex(AddressType.Receiving, index),
      })
    }
    for (let index = 0; index < changeAddressNumber; index++) {
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

  public static searchUsedChildAddresses = (keysData: KeysData) => {
    const children: HDAddress[] = []
    const nextUnusedIndex = Address.searchAddress(keysData)
    for (let index = 0; index < nextUnusedIndex; index++) {
      const { publicKey, path } = HD.keyFromHDIndex(keysData, index)
      if (publicKey) {
        const address = Address.addressFromPrivateKey(publicKey)
        if (Address.isUsedAddress(address)) {
          children.push({
            path,
            address,
          })
        }
      } else {
        throw new Error('Empty private key')
      }
    }
    return children
  }

  // TODO: refactor me
  public static searchAddress = (
    keysData: KeysData,
    startIndex = 0,
    maxUsedIndex = 0,
    minUnusedIndex = 100,
    depth = 0,
  ): any => {
    if (depth >= 10) return maxUsedIndex + 1
    if (!Address.isUsedAddress(Address.addressFromHDIndex(keysData, startIndex))) {
      if (startIndex === 0) {
        return 0
      }
      return Address.searchAddress(
        keysData,
        Math.floor((startIndex - maxUsedIndex) / 2 + maxUsedIndex),
        maxUsedIndex,
        Math.min(minUnusedIndex, startIndex),
        depth + 1,
      )
    }
    if (!Address.isUsedAddress(Address.addressFromHDIndex(keysData, startIndex + 1))) {
      return startIndex + 1
    }
    return Address.searchAddress(
      keysData,
      Math.round((minUnusedIndex - startIndex) / 2 + startIndex),
      Math.max(maxUsedIndex, startIndex),
      minUnusedIndex,
      depth + 1,
    )
  }
}

export default Address

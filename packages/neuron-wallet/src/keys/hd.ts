import * as bip32 from 'bip32'
import TransactionsService from '../services/transactions'
import { Child, KeysData } from './keystore'
import ckbCore from '../core'

enum BIP44Params {
  Purpose = "44'",
  // 360 is tentative value
  CoinTypeTestnet = "360'",
  Account = "0'",
}

enum AddressType {
  Receiving = 0,
  Change = 1,
}

const MaxAddressNumber = 30

class HD {
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
    const receivingAddresses = []
    const changeAddresses = []
    const root: bip32.BIP32Interface = bip32.fromPrivateKey(
      Buffer.from(keysData.privateKey, 'hex'),
      Buffer.from(keysData.chainCode, 'hex'),
    )
    for (let index = 0; index < receivingAddressNumber; index++) {
      receivingAddresses.push(HD.addressFromHDIndex(root, index, AddressType.Receiving))
    }
    for (let index = 0; index < changeAddressNumber; index++) {
      changeAddresses.push(HD.addressFromHDIndex(root, index, AddressType.Change))
    }
    return {
      receiving: receivingAddresses,
      change: changeAddresses,
    }
  }

  public static latestUnusedAddress = (keysData: KeysData) => {
    const root: bip32.BIP32Interface = bip32.fromPrivateKey(
      Buffer.from(keysData.privateKey, 'hex'),
      Buffer.from(keysData.chainCode, 'hex'),
    )
    const latestUnusedIndex = HD.searchAddress(root, 20)
    return HD.addressFromHDIndex(root, latestUnusedIndex)
  }

  public static isUsedAddress = (address: string) => {
    return TransactionsService.hasTransactions(address)
  }

  public static addressFromPrivateKey = (privateKey: string) => {
    const account = ckbCore.wallet.accountFromPrivateKey(Buffer.from(ckbCore.utils.hexToBytes(privateKey)))
    return ckbCore.utils.pubkeyToAddress(account.hexPubKey)
  }

  public static searchUsedChildKeys = (root: bip32.BIP32Interface) => {
    const children: Child[] = []
    const nextUnusedIndex = HD.searchAddress(root, 20)
    for (let index = 0; index < nextUnusedIndex; index++) {
      const path = HD.path(AddressType.Receiving, index)
      const { privateKey, chainCode } = root.derivePath(path)
      if (privateKey) {
        if (HD.isUsedAddress(HD.addressFromPrivateKey(privateKey.toString('hex')))) {
          children.push({
            path,
            privateKey: privateKey.toString('hex'),
            chainCode: chainCode.toString('hex'),
          })
        }
      } else {
        throw new Error('Empty private key')
      }
    }
    return children
  }

  public static path = (type: AddressType, index: number) => {
    return `m/${BIP44Params.Purpose}/${BIP44Params.CoinTypeTestnet}/${BIP44Params.Account}/${type}/${index}`
  }

  public static addressFromHDIndex = (root: bip32.BIP32Interface, index: number, type = AddressType.Receiving) => {
    const path = HD.path(type, index)
    const { privateKey } = root.derivePath(path)
    if (privateKey) {
      return HD.addressFromPrivateKey(privateKey.toString('hex'))
    }
    throw new Error('Empty private key')
  }

  // TODO: refactor me
  public static searchAddress = (
    root: bip32.BIP32Interface,
    index: number,
    maxUsedIndex = 0,
    minUnusedIndex = 100,
    depth = 0,
  ): any => {
    if (depth >= 10) return maxUsedIndex + 1
    if (!HD.isUsedAddress(HD.addressFromHDIndex(root, AddressType.Receiving, index))) {
      if (index === 0) {
        return 0
      }
      return HD.searchAddress(
        root,
        Math.floor((index - maxUsedIndex) / 2 + maxUsedIndex),
        maxUsedIndex,
        Math.min(minUnusedIndex, index),
        depth + 1,
      )
    }
    if (!HD.isUsedAddress(HD.addressFromHDIndex(root, index + 1))) {
      return index + 1
    }
    return HD.searchAddress(
      root,
      Math.round((minUnusedIndex - index) / 2 + index),
      Math.max(maxUsedIndex, index),
      minUnusedIndex,
      depth + 1,
    )
  }
}

export default HD

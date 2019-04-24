import * as bip32 from 'bip32'
import AddressType from '../address/type'
import Address from '../address/index'
import { Child, KeysData } from './keystore'

enum BIP44Params {
  Purpose = "44'",
  // 360 is tentative value
  CoinTypeTestnet = "360'",
  Account = "0'",
}

const searchAddressStartIndex = 0

class HD {
  public static path = (type: AddressType, index: number) => {
    return `m/${BIP44Params.Purpose}/${BIP44Params.CoinTypeTestnet}/${BIP44Params.Account}/${type}/${index}`
  }

  public static privateKeyFromHDIndex = (keysData: KeysData, index: number, type = AddressType.Receiving) => {
    const root: bip32.BIP32Interface = bip32.fromPrivateKey(
      Buffer.from(keysData.privateKey, 'hex'),
      Buffer.from(keysData.chainCode, 'hex'),
    )
    const path = HD.path(type, index)
    const { privateKey } = root.derivePath(path)
    if (privateKey) {
      return privateKey.toString('hex')
    }
    throw new Error('Empty private key')
  }

  public static searchUsedChildKeys = (keysData: KeysData) => {
    const children: Child[] = []
    const nextUnusedIndex = HD.searchAddress(keysData, searchAddressStartIndex)
    for (let index = 0; index < nextUnusedIndex; index++) {
      const path = HD.path(AddressType.Receiving, index)
      const root: bip32.BIP32Interface = bip32.fromPrivateKey(
        Buffer.from(keysData.privateKey, 'hex'),
        Buffer.from(keysData.chainCode, 'hex'),
      )
      const { privateKey, chainCode } = root.derivePath(path)
      if (privateKey) {
        if (Address.isUsedAddress(Address.addressFromPrivateKey(privateKey.toString('hex')))) {
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

  // TODO: refactor me
  public static searchAddress = (
    keysData: KeysData,
    startIndex: number,
    maxUsedIndex = 0,
    minUnusedIndex = 100,
    depth = 0,
  ): any => {
    if (depth >= 10) return maxUsedIndex + 1
    if (!Address.isUsedAddress(Address.addressFromHDIndex(keysData, startIndex))) {
      if (startIndex === 0) {
        return 0
      }
      return HD.searchAddress(
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
    return HD.searchAddress(
      keysData,
      Math.round((minUnusedIndex - startIndex) / 2 + startIndex),
      Math.max(maxUsedIndex, startIndex),
      minUnusedIndex,
      depth + 1,
    )
  }
}

export default HD

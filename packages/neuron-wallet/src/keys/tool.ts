import { BIP32 } from 'bip32'
import { Child } from './keystore'

// BIP44: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
enum BIP44Params {
  Purpose = "44'",
  // 360 is tentative value
  CoinTypeTestnet = "360'",
  Account = "0'",
  // external address
  Change = 0,
}

export default class Tool {
  private static root: BIP32

  public static searchUsedChildKeys(root: BIP32) {
    Tool.root = root
    const children: Child[] = []
    // TODO: refactor me
    const nextUnusedIndex = Tool.searchAddress(20)
    for (let index = 0; index < nextUnusedIndex; index++) {
      const path = Tool.getPath(index)
      const { privateKey, publicKey, chainCode } = root.derivePath(path)
      if (Tool.isUsedAddress(Tool.getAddressFromPublicKey(publicKey.toString('hex')))) {
        children.push({
          path,
          privateKey: privateKey.toString('hex'),
          chainCode: chainCode.toString('hex'),
        })
      }
    }
    return children
  }

  private static getPath(index: number): string {
    return `m/${BIP44Params.Purpose}/${BIP44Params.CoinTypeTestnet}/${BIP44Params.Account}/${
      BIP44Params.Change
    }/${index}`
  }

  private static isUsedAddress(address: string) {
    // TODO: check whether the address has history transactions
    return address.includes('ckb')
  }

  private static getAddressFromPublicKey(publicKey: string): string {
    return `ckb${publicKey}`
  }

  private static getAddressFromHDIndex(index: number): string {
    const path = Tool.getPath(index)
    const { publicKey } = Tool.root.derivePath(path)
    return Tool.getAddressFromPublicKey(publicKey.toString('hex'))
  }

  // minUnusedIndex should be big number, 100 is convenient to do test.
  // depth is loop depth for searching used address
  private static searchAddress(index: number, maxUsedIndex = 0, minUnusedIndex = 100, depth = 0): number {
    if (depth >= 10) return maxUsedIndex + 1
    if (!Tool.isUsedAddress(Tool.getAddressFromHDIndex(index))) {
      if (index === 0) {
        return 0
      }
      return Tool.searchAddress(
        Math.floor((index - maxUsedIndex) / 2 + maxUsedIndex),
        maxUsedIndex,
        Math.min(minUnusedIndex, index),
        depth + 1,
      )
    }
    if (!Tool.isUsedAddress(Tool.getAddressFromHDIndex(index + 1))) {
      return index + 1
    }
    return Tool.searchAddress(
      Math.round((minUnusedIndex - index) / 2 + index),
      Math.max(maxUsedIndex, index),
      minUnusedIndex,
      depth + 1,
    )
  }
}

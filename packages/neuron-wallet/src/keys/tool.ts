import { BIP32 } from 'bip32'
import { Child } from './keystore'

// BIP44: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const PURPOSE = "44'"
// 360 is tentative value
const COIN_TYPE_TESTNET: string = "360'"
const ACCOUNT = "0'"
// external address
const CHANGE = 0

export default class Tool {
  private static root: BIP32

  public static searchUsedChildKeys(root: BIP32) {
    this.root = root
    const children: Child[] = []
    // TODO: refactor me
    const nextUnusedIndex = this.searchIterationForExternalAddress(20)
    for (let index = 0; index < nextUnusedIndex; index++) {
      const path = Tool.getPath(index)
      const { privateKey, publicKey, chainCode } = root.derivePath(path)
      if (this.isUsedAddress(this.getAddressFromPublicKey(publicKey.toString('hex')))) {
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
    return `m/${PURPOSE}/${COIN_TYPE_TESTNET}/${ACCOUNT}/${CHANGE}/${index}`
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
    const { publicKey } = this.root.derivePath(path)
    return this.getAddressFromPublicKey(publicKey.toString('hex'))
  }

  // minUnusedIndex should be big number, 100 is convenient to do test.
  // depth is loop depth for searching used address
  private static searchIterationForExternalAddress(
    index: number,
    maxUsedIndex = 0,
    minUnusedIndex = 100,
    depth = 0,
  ): number {
    if (depth >= 10) return maxUsedIndex + 1
    if (!this.isUsedAddress(this.getAddressFromHDIndex(index))) {
      if (index === 0) {
        return 0
      }
      return this.searchIterationForExternalAddress(
        Math.floor((index - maxUsedIndex) / 2 + maxUsedIndex),
        maxUsedIndex,
        Math.min(minUnusedIndex, index),
        depth + 1,
      )
    }
    if (!this.isUsedAddress(this.getAddressFromHDIndex(index + 1))) {
      return index + 1
    }
    return this.searchIterationForExternalAddress(
      Math.round((minUnusedIndex - index) / 2 + index),
      Math.max(maxUsedIndex, index),
      minUnusedIndex,
      depth + 1,
    )
  }
}

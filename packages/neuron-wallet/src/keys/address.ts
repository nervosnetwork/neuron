import { BIP32 } from 'bip32'
import { Child } from './keystore'
import HD from './hd'

const Address = {
  searchUsedChildKeys: (root: BIP32) => {
    const children: Child[] = []
    // TODO: refactor me
    const nextUnusedIndex = Address.searchAddress(root, 20)
    for (let index = 0; index < nextUnusedIndex; index++) {
      const path = HD.getPath(index)
      const { privateKey, chainCode } = root.derivePath(path)
      if (Address.isUsedAddress(Address.getAddressFromPrivateKey(privateKey.toString('hex')))) {
        children.push({
          path,
          privateKey: privateKey.toString('hex'),
          chainCode: chainCode.toString('hex'),
        })
      }
    }
    return children
  },

  isUsedAddress: (address: string) => {
    // TODO: check whether the address has history transactions
    return address.includes('ckb')
  },

  getAddressFromPrivateKey: (privateKey: string) => {
    // TODO: generate address from private key
    return `ckb${privateKey}`
  },

  // minUnusedIndex should be big number, 100 is convenient to do test.
  // depth is loop depth for searching used address
  searchAddress: (root: BIP32, index: number, maxUsedIndex = 0, minUnusedIndex = 100, depth = 0): any => {
    if (depth >= 10) return maxUsedIndex + 1
    if (!Address.isUsedAddress(HD.getAddressFromHDIndex(root, index))) {
      if (index === 0) {
        return 0
      }
      return Address.searchAddress(
        root,
        Math.floor((index - maxUsedIndex) / 2 + maxUsedIndex),
        maxUsedIndex,
        Math.min(minUnusedIndex, index),
        depth + 1,
      )
    }
    if (!Address.isUsedAddress(HD.getAddressFromHDIndex(root, index + 1))) {
      return index + 1
    }
    return Address.searchAddress(
      root,
      Math.round((minUnusedIndex - index) / 2 + index),
      Math.max(maxUsedIndex, index),
      minUnusedIndex,
      depth + 1,
    )
  },
}

export default Address

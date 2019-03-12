import { BIP32 } from 'bip32'
import { Child } from './keystore'

// coin_type. 360 is tentative value  https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const COIN_TYPE_TESTNET: string = "360'"
// account: 0
const ACCOUNT = 0
// external address
const CHANGE = 0

const GAP_LIMIT = 20

export default class Tool {
  public static searchUsedChildKeys(root: BIP32) {
    const children: Child[] = []
    // TODO: refactor search logic to reduce loop
    for (let index = 0; index < GAP_LIMIT; index++) {
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
    return `m/44'/${COIN_TYPE_TESTNET}/${ACCOUNT}'/${CHANGE}/${index}`
  }

  private static isUsedAddress(address: string) {
    // TODO: check whether the address has history transactions
    return address.includes('ckb')
  }

  private static getAddressFromPublicKey(publicKey: string): string {
    return `ckb${publicKey}`
  }
}

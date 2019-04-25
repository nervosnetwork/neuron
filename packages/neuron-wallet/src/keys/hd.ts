import * as bip32 from 'bip32'
import AddressType from '../address/type'
import { KeysData } from './keystore'

enum BIP44Params {
  Purpose = "44'",
  // 360 is tentative value
  CoinTypeTestnet = "360'",
  Account = "0'",
}

class HD {
  public static pathFromIndex = (type: AddressType, index: number) => {
    return `m/${BIP44Params.Purpose}/${BIP44Params.CoinTypeTestnet}/${BIP44Params.Account}/${type}/${index}`
  }

  public static indexFromPath = (path: string) => {
    const array: string[] = path.split('/')
    return array[array.length - 1]
  }

  public static keyFromHDIndex = (keysData: KeysData, index: number, type = AddressType.Receiving) => {
    const root: bip32.BIP32Interface = bip32.fromPrivateKey(
      Buffer.from(keysData.privateKey, 'hex'),
      Buffer.from(keysData.chainCode, 'hex'),
    )
    const path = HD.pathFromIndex(type, index)
    const { privateKey, publicKey } = root.derivePath(path)
    if (privateKey && publicKey && path) {
      return {
        privateKey: privateKey.toString('hex'),
        publicKey: publicKey.toString('hex'),
        path,
      }
    }
    throw new Error('Empty private key')
  }
}

export default HD

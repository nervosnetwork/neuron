import * as bip32 from 'bip32'
import AddressType from '../address/type'
import { KeysData } from './keystore'

// 360 is just a tentative value, and we also need a coin type of mainnet.
const COIN_TYPE_TESTNET = "360'"

class HD {
  public static pathFromIndex = (type: AddressType, index: number) => {
    return `m/44'/${COIN_TYPE_TESTNET}/0'/${type}/${index}`
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

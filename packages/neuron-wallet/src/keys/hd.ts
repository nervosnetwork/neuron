import { AddressType } from '../services/addresses'
import { ExtendedPublicKey } from './key'
import Keychain from './keychain'

class HD {
  public static pathFromIndex = (type: AddressType, index: number) => {
    return `m/44'/309'/0'/${type}/${index}`
  }

  public static indexFromPath = (path: string) => {
    const array: string[] = path.split('/')
    return array[array.length - 1]
  }

  public static keyFromHDIndex = (extendedKey: ExtendedPublicKey, index: number, type = AddressType.Receiving) => {
    const path = HD.pathFromIndex(type, index)
    const keychain = Keychain.fromPublicKey(
      Buffer.from(extendedKey.publicKey, 'hex'),
      Buffer.from(extendedKey.chainCode, 'hex'),
      path
    )
    return {
      privateKey: keychain.privateKey.toString('hex'),
      publicKey: keychain.publicKey.toString('hex'),
      path,
    }
  }
}

export default HD

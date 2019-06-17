import { AddressType } from '../services/addresses'
import { ExtendedPublicKey } from './key'
import Keychain from './keychain'

class HD {
  public static extendedKeyPath = `m/44'/309'/0'`
  public static pathFor = (type: AddressType, index: number) => {
    return `${HD.extendedKeyPath}/${type}/${index}`
  }

  public static pathForReceiving = (index: number) => {
    return HD.pathFor(AddressType.Receiving, index)
  }

  public static pathForChange = (index: number) => {
    return HD.pathFor(AddressType.Change, index)
  }

  // extendedKey: always be the extended public key for path `m/44'/309'/0'`.
  public static keyFromExtendedPublicKey = (
    extendedKey: ExtendedPublicKey,
    type = AddressType.Receiving,
    index: number
  ) => {
    const keychain = Keychain.fromPublicKey(
      Buffer.from(extendedKey.publicKey, 'hex'),
      Buffer.from(extendedKey.chainCode, 'hex'),
      HD.extendedKeyPath
    )
      .deriveChild(type, false)
      .deriveChild(index, false)
    return {
      publicKey: keychain.publicKey.toString('hex'),
      path: HD.pathFor(type, index),
    }
  }
}

export default HD

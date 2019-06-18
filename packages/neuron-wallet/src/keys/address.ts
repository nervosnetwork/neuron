import { ExtendedPublicKey } from './key'
import Keychain from './keychain'

export enum AddressType {
  Receiving = 0, // External chain
  Change = 1, // Internal chain
}

export default class Address {
  address: string
  path: string // BIP44 change/address_index (address_type/index)

  constructor(address: string, path: string) {
    this.address = address
    this.path = path
  }

  public static extendedKeyPath = `m/44'/309'/0'`
  public static pathFor = (type: AddressType, index: number) => {
    return `${Address.extendedKeyPath}/${type}/${index}`
  }

  public static pathForReceiving = (index: number) => {
    return Address.pathFor(AddressType.Receiving, index)
  }

  public static pathForChange = (index: number) => {
    return Address.pathFor(AddressType.Change, index)
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
      Address.extendedKeyPath
    )
      .deriveChild(type, false)
      .deriveChild(index, false)
    return {
      publicKey: keychain.publicKey.toString('hex'),
      path: Address.pathFor(type, index),
    }
  }
}

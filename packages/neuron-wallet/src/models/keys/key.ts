import crypto from 'crypto'

import Address, { AddressType, AddressPrefix } from './address'
import Keychain, { privateToPublic } from './keychain'
import { entropyToMnemonic } from './mnemonic'

export interface PathAndPrivateKey {
  path: string
  privateKey: string
}

const UNCOMPRESSED_KEY_LENGTH = 130

export class ExtendedPublicKey {
  publicKey: string
  chainCode: string

  constructor(publicKey: string, chainCode: string) {
    this.publicKey = ExtendedPublicKey.compressPublicKey(publicKey)
    this.chainCode = chainCode
  }

  static compressPublicKey = (key: string) => {
    if (key.length !== UNCOMPRESSED_KEY_LENGTH) {
      return key
    }

    const publicKey = Buffer.from(key, 'hex')
    const compressedPublicKey = Buffer
      .alloc(33)
      // '03' for odd value, '02' for even value
      .fill(publicKey[64] & 1 ? '03' : '02', 0, 1, 'hex')
      .fill(publicKey.subarray(1, 33), 1, 33)
    return compressedPublicKey.toString('hex')
  }

  isUncompressedKey = (publicKey: string) => {
    return publicKey.startsWith('04')
  }

  serialize = () => {
    return this.publicKey + this.chainCode
  }

  static parse = (serialized: string) => {
    return new ExtendedPublicKey(serialized.slice(0, 66), serialized.slice(66))
  }
}

// Extended public key of the BIP44 path down to account level,
// which is `m/44'/309'/0'`. This key will be persisted to wallet
// and used to derive receiving/change addresses.
export class AccountExtendedPublicKey extends ExtendedPublicKey {
  public static ckbAccountPath = `m/44'/309'/0'`

  static parse = (serialized: string) => {
    return new AccountExtendedPublicKey(serialized.slice(0, 66), serialized.slice(66))
  }

  address = (
    type: AddressType = AddressType.Receiving,
    index: number,
    prefix: AddressPrefix = AddressPrefix.Testnet
  ): Address => {
    return Address.fromPublicKey(this.addressPublicKey(type, index), Address.pathFor(type, index), prefix)
  }

  private addressPublicKey = (type = AddressType.Receiving, index: number) => {
    const keychain = Keychain.fromPublicKey(
      Buffer.from(this.publicKey, 'hex'),
      Buffer.from(this.chainCode, 'hex'),
      AccountExtendedPublicKey.ckbAccountPath
    )
      .deriveChild(type, false)
      .deriveChild(index, false)

    return keychain.publicKey.toString('hex')
  }
}

export class ExtendedPrivateKey {
  privateKey: string
  chainCode: string

  constructor(privateKey: string, chainCode: string) {
    this.privateKey = privateKey
    this.chainCode = chainCode
  }

  serialize = () => {
    return this.privateKey + this.chainCode
  }

  toExtendedPublicKey = (): ExtendedPublicKey => {
    const publicKey = privateToPublic(Buffer.from(this.privateKey, 'hex')).toString('hex')
    return new ExtendedPublicKey(publicKey, this.chainCode)
  }

  static parse = (serialized: string) => {
    return new ExtendedPrivateKey(serialized.slice(0, 64), serialized.slice(64))
  }
}

export enum DefaultAddressNumber {
  Receiving = 20,
  Change = 10,
}

export interface Addresses {
  receiving: Address[]
  change: Address[]
}

// Generate 12 words mnemonic code
export const generateMnemonic = () => {
  const entropySize = 16
  const entropy = crypto.randomBytes(entropySize).toString('hex')
  return entropyToMnemonic(entropy)
}

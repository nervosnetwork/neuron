import crypto from 'crypto'

import Address from './address'
import { privateToPublic } from './keychain'
import { entropyToMnemonic } from './mnemonic'

export class ExtendedPublicKey {
  publicKey: string
  chainCode: string

  constructor(publicKey: string, chainCode: string) {
    this.publicKey = publicKey
    this.chainCode = chainCode
  }

  serialize = () => {
    return this.publicKey + this.chainCode
  }

  static parse = (serialized: string) => {
    return new ExtendedPublicKey(serialized.slice(0, 66), serialized.slice(66))
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

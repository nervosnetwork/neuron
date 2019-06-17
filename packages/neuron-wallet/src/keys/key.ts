import crypto from 'crypto'

import Address, { HDAddress } from '../services/addresses'
import Keystore from './keystore'
import Keychain, { privateToPublic } from './keychain'
import { Validate, Required, Password } from '../decorators'
import { IsRequired, InvalidMnemonic } from '../exceptions'
import { entropyToMnemonic, validateMnemonic, mnemonicToSeed } from './mnemonic'

const ENTROPY_SIZE = 16

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
  receiving: HDAddress[]
  change: HDAddress[]
}

export default class Key {
  public keystore?: Keystore
  public addresses?: Addresses

  constructor(keystore: Keystore | undefined) {
    this.keystore = keystore
  }

  static generateMnemonic = () => {
    const entropy = crypto.randomBytes(ENTROPY_SIZE).toString('hex')
    return entropyToMnemonic(entropy)
  }

  @Validate
  static async fromKeystore(@Required keystore: Keystore, @Password password: string) {
    const extendedPrivateKey = keystore.extendedPrivatKey(password)
    const key = new Key(keystore)
    key.addresses = Address.generateAddresses(extendedPrivateKey.toExtendedPublicKey())
    return key
  }

  @Validate
  public static async fromMnemonic(@Required mnemonic: string, @Password password: string) {
    if (!validateMnemonic(mnemonic)) {
      throw new InvalidMnemonic()
    }

    const seed = await mnemonicToSeed(mnemonic)
    const root = Keychain.fromSeed(seed)
    if (!root.privateKey) {
      throw new InvalidMnemonic()
    }
    const extendedKey = new ExtendedPrivateKey(root.privateKey.toString('hex'), root.chainCode.toString('hex'))
    const keystore = Keystore.create(extendedKey, password)
    const key = new Key(keystore)
    key.addresses = Address.generateAddresses(extendedKey.toExtendedPublicKey())
    return key
  }

  public checkPassword = (password: string) => {
    if (password === undefined) {
      throw new IsRequired('Password')
    }
    if (this.keystore === undefined) {
      throw new IsRequired('Keystore')
    }

    return this.keystore.checkPassword(password)
  }
}

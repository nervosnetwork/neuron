import crypto from 'crypto'
import SHA3 from 'sha3'
import { v4 as uuid } from 'uuid'
import { ec as EC } from 'elliptic'

import Address, { HDAddress } from '../services/addresses'
import { Keystore, KdfParams } from './keystore'
import { Keychain } from './hd'
import { Validate, Required, Password } from '../decorators'
import { IncorrectPassword, IsRequired, InvalidMnemonic, UnsupportedCipher } from '../exceptions'
import { entropyToMnemonic, validateMnemonic, mnemonicToSeed } from '../utils/mnemonic'

const ec = new EC('secp256k1')

const ENTROPY_SIZE = 16

// Private/Public key and chain code.
export class ExtendedKey {
  privateKey?: string
  publicKey?: string
  chainCode: string

  constructor(privateKey: string | undefined, publicKey: string | undefined, chainCode: string) {
    this.privateKey = privateKey
    this.publicKey = publicKey
    this.chainCode = chainCode
  }

  serializePrivate = () => {
    return this.privateKey! + this.chainCode
  }

  serializePublic = () => {
    return this.privateKey! + this.chainCode
  }

  static parsePrivate = (serialized: string) => {
    const privateKey = serialized.slice(0, 64)
    const publicKey = ec.keyFromPrivate(privateKey).getPublic(true, 'hex') as string
    return new ExtendedKey(privateKey, publicKey, serialized.slice(64))
  }

  static parsePublic = (serialized: string) => {
    return new ExtendedKey(undefined, serialized.slice(0, 64), serialized.slice(64))
  }
}

export interface Addresses {
  receiving: HDAddress[]
  change: HDAddress[]
}

enum DefaultAddressNumber {
  Receiving = 20,
  Change = 10,
}

export default class Key {
  public mnemonic?: string
  public keystore?: Keystore
  public extendedKey?: ExtendedKey
  public addresses?: Addresses

  constructor({
    mnemonic,
    keystore,
    extendedKey,
    addresses,
  }: {
    mnemonic?: string
    keystore?: Keystore
    extendedKey?: ExtendedKey
    addresses?: Addresses
  } = {}) {
    this.mnemonic = mnemonic
    this.keystore = keystore
    this.extendedKey = extendedKey
    this.addresses = addresses
  }

  static generateMnemonic = () => {
    const entropy = crypto.randomBytes(ENTROPY_SIZE).toString('hex')
    return entropyToMnemonic(entropy)
  }

  @Validate
  static async fromKeystore(@Required keystore: string, @Password password: string) {
    const keystoreObject: Keystore = JSON.parse(keystore)
    const key = new Key()
    key.keystore = keystoreObject
    if (!key.checkPassword(password)) {
      throw new IncorrectPassword()
    }
    const { kdfparams } = keystoreObject.crypto
    const derivedKey: Buffer = crypto.scryptSync(
      Buffer.from(password),
      Buffer.from(kdfparams.salt, 'hex'),
      kdfparams.dklen,
      {
        N: kdfparams.n,
        r: kdfparams.r,
        p: kdfparams.p,
      }
    )
    const ciphertext = Buffer.from(keystoreObject.crypto.ciphertext, 'hex')
    const mac = new SHA3(256)
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest()
      .toString('hex')
    if (mac !== keystoreObject.crypto.mac) {
      throw new Error('Key derivation failed - possibly wrong password')
    }
    const decipher = crypto.createDecipheriv(
      keystoreObject.crypto.cipher,
      derivedKey.slice(0, 16),
      Buffer.from(keystoreObject.crypto.cipherparams.iv, 'hex')
    )
    const encrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('hex')
    const extendedKey = ExtendedKey.parsePrivate(encrypted)
    key.extendedKey = extendedKey
    key.addresses = Address.generateAddresses(extendedKey, DefaultAddressNumber.Receiving, DefaultAddressNumber.Change)
    return key
  }

  @Validate
  public static async fromMnemonic(@Required mnemonic: string, @Password password: string) {
    if (!validateMnemonic(mnemonic)) {
      throw new InvalidMnemonic()
    }
    const key = new Key()
    key.extendedKey = await key.extendedKeyFromMnemonic(mnemonic)
    key.addresses = Address.generateAddresses(
      key.extendedKey,
      DefaultAddressNumber.Receiving,
      DefaultAddressNumber.Change
    )
    key.keystore = key.toKeystore(key.extendedKey.serializePrivate(), password)
    return key
  }

  public checkPassword = (password: string) => {
    if (password === undefined) {
      throw new IsRequired('Password')
    }
    if (this.keystore === undefined) {
      throw new IsRequired('Keystore')
    }
    const { kdfparams } = this.keystore.crypto
    const derivedKey: Buffer = crypto.scryptSync(
      Buffer.from(password),
      Buffer.from(kdfparams.salt, 'hex'),
      kdfparams.dklen,
      {
        N: kdfparams.n,
        r: kdfparams.r,
        p: kdfparams.p,
      }
    )
    const ciphertext = Buffer.from(this.keystore.crypto.ciphertext, 'hex')
    const mac = new SHA3(256)
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest()
      .toString('hex')
    return mac === this.keystore.crypto.mac
  }

  public nextUnusedAddress = () => {
    if (this.extendedKey) {
      return Address.nextUnusedAddress(this.extendedKey)
    }
    return ''
  }

  public allUsedAddresses = () => {
    if (this.extendedKey) {
      return Address.searchUsedAddresses(this.extendedKey)
    }
    return []
  }

  private extendedKeyFromMnemonic = async (mnemonic: string) => {
    const seed = await mnemonicToSeed(mnemonic)
    const root = Keychain.fromSeed(seed)
    if (root.privateKey) {
      return new ExtendedKey(
        root.privateKey.toString('hex'),
        root.publicKey.toString('hex'),
        root.chainCode.toString('hex')
      )
    }
    throw new InvalidMnemonic()
  }

  public toKeystore = (encryptedData: string, password: string) => {
    const salt = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    const params = {
      n: 8192,
      r: 8,
      p: 1,
    }
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: salt.toString('hex'),
      ...params,
    }
    const derivedKey: Buffer = crypto.scryptSync(Buffer.from(password), salt, kdfparams.dklen, {
      N: kdfparams.n,
      r: kdfparams.r,
      p: kdfparams.p,
    })

    const cipher = crypto.createCipheriv('aes-128-ctr', derivedKey.slice(0, 16), iv)
    if (!cipher) {
      throw new UnsupportedCipher()
    }
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(encryptedData, 'utf8')), cipher.final()])
    const hash = new SHA3(256)
    const mac = hash
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest()
      .toString('hex')

    return {
      version: 3,
      id: uuid(),
      crypto: {
        ciphertext: ciphertext.toString('hex'),
        cipherparams: {
          iv: iv.toString('hex'),
        },
        cipher: 'aes-128-ctr',
        kdf: 'scrypt',
        kdfparams,
        mac,
      },
    }
  }
}

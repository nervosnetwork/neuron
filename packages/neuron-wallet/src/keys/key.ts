import * as bip32 from 'bip32'
import bip39 from 'bip39'
import crypto from 'crypto-browserify'
import scryptsy from 'scrypt.js'
import SHA3 from 'sha3'
import { v4 } from 'uuid'
import Address from '../address/index'
import { Keystore, KdfParams, KeysData } from './keystore'

export interface HDAddress {
  address: string
  path: string
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

  public keysData?: KeysData

  public addresses?: Addresses

  constructor({
    mnemonic,
    keystore,
    keysData,
    addresses,
  }: {
    mnemonic?: string
    keystore?: Keystore
    keysData?: KeysData
    addresses?: Addresses
  } = {}) {
    this.mnemonic = mnemonic
    this.keystore = keystore
    this.keysData = keysData
    this.addresses = addresses
  }

  static generateMnemonic = () => {
    return bip39.generateMnemonic()
  }

  static fromKeystore(
    keystore: string,
    password: string,
    receivingAddressNumber = DefaultAddressNumber.Receiving,
    changeAddressNumber = DefaultAddressNumber.Change,
  ) {
    const keystoreObject: Keystore = JSON.parse(keystore)
    const key = new Key()
    key.keystore = keystoreObject
    if (password === undefined) {
      throw new Error('No password given.')
    } else if (!key.checkPassword(password)) {
      throw new Error('Password error.')
    }
    const { kdfparams } = keystoreObject.crypto
    const derivedKey = scryptsy(
      Buffer.from(password),
      Buffer.from(kdfparams.salt, 'hex'),
      kdfparams.n,
      kdfparams.r,
      kdfparams.p,
      kdfparams.dklen,
    )
    const ciphertext = Buffer.from(keystoreObject.crypto.ciphertext, 'hex')
    const hash = new SHA3(256)
    const mac = hash
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest()
      .toString('hex')
      .replace('0x', '')
    if (mac !== keystoreObject.crypto.mac) {
      throw new Error('Key derivation failed - possibly wrong password')
    }
    const decipher = crypto.createDecipheriv(
      keystoreObject.crypto.cipher,
      derivedKey.slice(0, 16),
      Buffer.from(keystoreObject.crypto.cipherparams.iv, 'hex'),
    )
    const seed = `0x${Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('hex')}`
    const keysData = Buffer.from(seed.replace('0x', ''), 'hex').toString()
    key.keysData = JSON.parse(keysData)
    key.addresses = Address.generateAddresses(JSON.parse(keysData), receivingAddressNumber, changeAddressNumber)
    return key
  }

  public static fromMnemonic(
    mnemonic: string,
    password: string,
    receivingAddressNumber = DefaultAddressNumber.Receiving,
    changeAddressNumber = DefaultAddressNumber.Change,
  ) {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Wrong Mnemonic')
    }
    const key = new Key()
    const keysData = key.generatePrivateKeyFromMnemonic(mnemonic)
    key.keysData = keysData
    key.addresses = Address.generateAddresses(keysData, receivingAddressNumber, changeAddressNumber)
    key.keystore = key.toKeystore(JSON.stringify(keysData), password)
    return key
  }

  public checkPassword = (password: string) => {
    if (password === undefined) {
      throw new Error('No password given.')
    }
    if (this.keystore === undefined) {
      throw new Error('Keystore is undefined.')
    }
    const { kdfparams } = this.keystore.crypto
    const derivedKey = scryptsy(
      Buffer.from(password),
      Buffer.from(kdfparams.salt, 'hex'),
      kdfparams.n,
      kdfparams.r,
      kdfparams.p,
      kdfparams.dklen,
    )
    const ciphertext = Buffer.from(this.keystore.crypto.ciphertext, 'hex')
    const hash = new SHA3(256)
    const mac = hash
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest()
      .toString('hex')
      .replace('0x', '')
    return mac === this.keystore.crypto.mac
  }

  public latestUnusedAddress = () => {
    if (this.keysData) {
      return Address.latestUnusedAddress(this.keysData)
    }
    return ''
  }

  public allUsedAddress = () => {
    if (this.keysData) {
      return Address.searchUsedChildAddresses(this.keysData)
    }
    return []
  }

  private generatePrivateKeyFromMnemonic = (mnemonic: string) => {
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    if (root.privateKey) {
      const privateKey = root.privateKey.toString('hex')
      const chainCode = root.chainCode.toString('hex')
      const keysData: KeysData = {
        privateKey,
        chainCode,
      }
      return keysData
    }
    throw new Error('Wrong mnemonic')
  }

  public toKeystore = (encryptedData: string, password: string) => {
    const salt = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    const kdf = 'scrypt'
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
    const derivedKey = scryptsy(Buffer.from(password), salt, kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen)

    const cipher = crypto.createCipheriv('aes-128-ctr', derivedKey.slice(0, 16), iv)
    if (!cipher) {
      throw new Error('Unsupported cipher')
    }
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(encryptedData, 'utf8')), cipher.final()])
    const hash = new SHA3(256)
    const mac = hash
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest()
      .toString('hex')
      .replace('0x', '')
    return {
      version: 0,
      id: v4(),
      crypto: {
        ciphertext: ciphertext.toString('hex'),
        cipherparams: {
          iv: iv.toString('hex'),
        },
        cipher: 'aes-128-ctr',
        kdf,
        kdfparams,
        mac,
      },
    }
  }
}

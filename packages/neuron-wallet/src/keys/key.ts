import * as bip39 from 'bip39'
import crypto from 'crypto'
import SHA3 from 'sha3'
import { v4 as uuid } from 'uuid'
import Address, { HDAddress } from '../services/addresses'
import { Keystore, KdfParams, KeysData } from './keystore'
import { Keychain } from './hd'
import { Validate, Required, Password } from '../decorators'
import { IncorrectPassword, IsRequired, InvalidMnemonic, UnsupportedCipher } from '../exceptions'

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

  @Validate
  static async fromKeystore(
    @Required keystore: string,
    @Password password: string,
    receivingAddressNumber = DefaultAddressNumber.Receiving,
    changeAddressNumber = DefaultAddressNumber.Change,
  ) {
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
      },
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

  @Validate
  public static async fromMnemonic(
    @Required mnemonic: string,
    @Password password: string,
    receivingAddressNumber = DefaultAddressNumber.Receiving,
    changeAddressNumber = DefaultAddressNumber.Change,
  ) {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new InvalidMnemonic()
    }
    const key = new Key()
    const keysData = await key.generatePrivateKeyFromMnemonic(mnemonic)
    key.keysData = keysData
    key.addresses = Address.generateAddresses(keysData, receivingAddressNumber, changeAddressNumber)
    key.keystore = key.toKeystore(JSON.stringify(keysData), password)
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
      },
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

  public nextUnusedAddress = () => {
    if (this.keysData) {
      return Address.nextUnusedAddress(this.keysData)
    }
    return ''
  }

  public allUsedAddresses = () => {
    if (this.keysData) {
      return Address.searchUsedAddresses(this.keysData)
    }
    return []
  }

  private generatePrivateKeyFromMnemonic = async (mnemonic: string) => {
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const root = Keychain.fromSeed(seed)
    if (root.privateKey) {
      const privateKey = root.privateKey.toString('hex')
      const chainCode = root.chainCode.toString('hex')
      const keysData: KeysData = {
        privateKey,
        chainCode,
      }
      return keysData
    }
    throw new InvalidMnemonic()
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
      .replace('0x', '')
    return {
      version: 3,
      id: uuid(),
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

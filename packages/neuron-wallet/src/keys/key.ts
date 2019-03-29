import bip32 from 'bip32'
import bip39 from 'bip39'
import crypto from 'crypto-browserify'
import scryptsy from 'scrypt.js'
import SHA3 from 'sha3'
import { v4 } from 'uuid'
import Address from './address'
import { Keystore, KdfParams } from './keystore'

export default class Key {
  public static createKey(password: string) {
    const mnemonic = bip39.generateMnemonic()
    const key = Key.generatePrivateKeyFromMnemonic(mnemonic)
    const keystore = Key.toKeystore(JSON.stringify(key), password)
    return {
      address: Address.getAddressFromPrivateKey(key.privateKey),
      mnemonic,
      keystore: JSON.stringify(keystore),
    }
  }

  public static toKeystore(key: string, password: string) {
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
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(key, 'utf8')), cipher.final()])
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

  public static fromKeystore = (keystore: Keystore, password: string) => {
    if (password === undefined) {
      throw new Error('No password given.')
    }
    const { kdfparams } = keystore.crypto

    const derivedKey = scryptsy(
      Buffer.from(password),
      Buffer.from(kdfparams.salt, 'hex'),
      kdfparams.n,
      kdfparams.r,
      kdfparams.p,
      kdfparams.dklen,
    )

    const ciphertext = Buffer.from(keystore.crypto.ciphertext, 'hex')
    const hash = new SHA3(256)
    const mac = hash
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest()
      .toString('hex')
      .replace('0x', '')
    if (mac !== keystore.crypto.mac) {
      throw new Error('Key derivation failed - possibly wrong password')
    }

    const decipher = crypto.createDecipheriv(
      keystore.crypto.cipher,
      derivedKey.slice(0, 16),
      Buffer.from(keystore.crypto.cipherparams.iv, 'hex'),
    )
    const seed = `0x${Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('hex')}`
    return Buffer.from(seed.replace('0x', ''), 'hex').toString()
  }

  public static fromMnemonic = (mnemonic: string, password: string) => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Wrong Mnemonic')
    }
    const key = Key.generatePrivateKeyFromMnemonic(mnemonic)
    const keystore = Key.toKeystore(JSON.stringify(key), password)
    return {
      address: Address.getAddressFromPrivateKey(JSON.stringify(key)),
      keystore,
    }
  }

  public static generatePrivateKeyFromMnemonic(mnemonic: string) {
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    const privateKey = root.privateKey.toString('hex')
    const chainCode = root.chainCode.toString('hex')
    return {
      privateKey,
      chainCode,
    }
  }

  public static checkPassword(keystore: Keystore, password: string) {
    if (password === undefined) {
      throw new Error('No password given.')
    }
    const { kdfparams } = keystore.crypto

    const derivedKey = scryptsy(
      Buffer.from(password),
      Buffer.from(kdfparams.salt, 'hex'),
      kdfparams.n,
      kdfparams.r,
      kdfparams.p,
      kdfparams.dklen,
    )

    const ciphertext = Buffer.from(keystore.crypto.ciphertext, 'hex')
    const hash = new SHA3(256)
    const mac = hash
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest()
      .toString('hex')
      .replace('0x', '')
    return mac === keystore.crypto.mac
  }
}

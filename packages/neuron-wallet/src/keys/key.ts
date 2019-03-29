import bip32 from 'bip32'
import bip39 from 'bip39'
import crypto from 'crypto-browserify'
import scryptsy from 'scrypt.js'
import SHA3 from 'sha3'
import { v4 } from 'uuid'
import { KdfParams } from './keystore'

export default class Key {
  public static createKey(password: string) {
    const mnemonic = bip39.generateMnemonic()
    const key = Key.generatePrivateKeyFromMnemonic(mnemonic)
    const keystore = Key.toKeystore(JSON.stringify(key), password)
    return {
      address: Key.getAddressFromPrivateKey(key.privateKey),
      mnemonic,
      keystore: JSON.stringify(keystore),
    }
  }

  public static getAddressFromPrivateKey(privateKey: string) {
    // TODO: generate address from private key
    return `address_${privateKey}`
  }

  public static toKeystore(key: string, password: string) {
    const salt = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)

    const kdf = 'scrypt'
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: salt.toString('hex'),
      n: 8192,
      r: 8,
      p: 1,
    }

    const params: scryptsy.Params = {
      N: 8192,
      r: 8,
      p: 1,
    }
    const derivedKey = scryptsy.hashSync(Buffer.from(password), params, kdfparams.dklen, kdfparams.salt)

    const cipher = crypto.createCipheriv('aes-128-ctr', derivedKey.slice(0, 16), iv)
    if (!cipher) {
      throw new Error('Unsupported cipher')
    }

    const ciphertext = Buffer.concat([cipher.update(Buffer.from(key.replace('0x', ''), 'hex')), cipher.final()])
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
        ciphertext,
        cipherparams: {
          iv,
        },
        cipher: 'aes-128-ctr',
        kdf,
        kdfparams,
        mac,
      },
    }
  }

  public static fromMnemonic = (mnemonic: string, password: string) => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Wrong Mnemonic')
    }
    const key = Key.generatePrivateKeyFromMnemonic(mnemonic)
    const keystore = Key.toKeystore(JSON.stringify(key), password)
    return {
      address: Key.getAddressFromPrivateKey(key.privateKey),
      keystore: JSON.stringify(keystore),
    }
  }

  private static generatePrivateKeyFromMnemonic(mnemonic: string) {
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    const privateKey = root.privateKey.toString('hex')
    const chainCode = root.chainCode.toString('hex')
    return {
      privateKey,
      chainCode,
    }
  }
}

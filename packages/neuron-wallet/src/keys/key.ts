import bip32 from 'bip32'
import bip39 from 'bip39'
import crypto from 'crypto-browserify'

export default class Key {
  public static createKey(password: string) {
    const mnemonic = bip39.generateMnemonic()
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    const privateKey = root.privateKey.toString('hex')
    const chainCode = root.chainCode.toString('hex')
    const key = { privateKey, chainCode }
    const keystore = Key.toKeystore(JSON.stringify(key), password)
    return {
      address: Key.getAddressFromPrivateKey(privateKey),
      keystore: JSON.stringify(keystore),
    }
  }

  public static getAddressFromPrivateKey(privateKey: string) {
    // TODO: generate address from private key
    return `address_${privateKey}`
  }

  public static toKeystore(key: string, password: string) {
    return {
      version: 0,
      id: crypto.randomBytes(16),
      crypto: {
        ciphertext: `${key}_${password}`,
        cipherparams: {
          iv: crypto.randomBytes(16),
        },
        cipher: 'aes-128-ctr',
        mac: crypto.randomBytes(16),
      },
    }
  }

  public static fromMnemonic = (mnemonic: string, derive: boolean, password: string) => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Wrong Mnemonic')
    }
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    const privateKey = root.privateKey.toString('hex')
    const chainCode = root.chainCode.toString('hex')
    const key = { privateKey, chainCode }
    const keystore = Key.toKeystore(JSON.stringify(key), password)
    return {
      address: Key.getAddressFromPrivateKey(privateKey),
      keystore: JSON.stringify(keystore),
    }
  }
}

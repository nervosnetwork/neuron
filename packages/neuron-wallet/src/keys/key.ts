import bip32 from 'bip32'
import bip39 from 'bip39'
import { Keystore, Child } from './keystore'

export default class Key {
  private keystore: Keystore

  private mnemonic: string

  constructor(keystore: Keystore, mnemonic: string) {
    this.keystore = keystore
    this.mnemonic = mnemonic
  }

  public static fromKeystore = (keystore: Keystore) => {
    return new Key(keystore, '')
  }

  public static fromKeystoreJson = (json: string) => {
    return new Key(JSON.parse(json), '')
  }

  getKeystore = () => this.keystore

  getKeystoreJson = () => JSON.stringify(this.keystore)

  getMnemonic = () => this.mnemonic

  public static generateKey = () => {
    const mnemonic = bip39.generateMnemonic()
    return Key.fromMnemonic(mnemonic, false)
  }

  public static fromMnemonic = (mnemonic: string, derive: boolean) => {
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    const master = {
      privateKey: root.privateKey.toString('hex'),
      chainCode: root.chainCode.toString('hex'),
    }
    const keystore: Keystore = {
      master,
    }
    if (derive) {
      keystore.children = Key.searchUsedAddress()
    }
    return new Key(keystore, mnemonic)
  }

  private static searchUsedAddress() {
    const children: Child[] = []
    for (let depth = 0; depth < 4; depth++) {
      // TODO: refactor search logic to reduce loop
      for (let index = 0; index < 4; index++) {
        const isUsed = Key.isUsedAddressFromDepthIndex(depth, index)
        if (isUsed) {
          children.push({
            path: `m/${depth}/${index}`,
            depth,
            privateKey: 'privateKey',
            chainCode: 'chainCode',
          })
        }
      }
    }
    return children
  }

  private static isUsedAddressFromDepthIndex(depth: number, index: number) {
    // TODO: check address(depth, index) whether used nor not
    return depth < 2 && index < 2
  }
}

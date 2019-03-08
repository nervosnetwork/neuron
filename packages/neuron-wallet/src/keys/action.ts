import { Keystore } from './keystore'
import Key from './key'

export default interface Action {
  fromKeystoreJson(json: string): Key
  fromKeystore(keystore: Keystore): Key
  fromMnemonic(mnemonic: string, derive: boolean): Key
  getKeystore(): Keystore
  getKeystoreJson(): string
  getMnemonic(): string
  generateKey(): Key
}

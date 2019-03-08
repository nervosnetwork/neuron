import { KeyStore } from './keystore'
import Key from './key'

export default interface Action {
  fromKeyStoreJson(json: string): Key
  fromKeyStore(keystore: KeyStore): Key
  fromMnemonic(mnemonic: string, derive: boolean): Key
  getKeyStore(): KeyStore
  getKeyStoreJson(): string
  getMnemonic(): string
  generateKey(): Key
}

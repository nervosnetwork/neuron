import { KeyStore } from './keystore'

export default class Key {
  keystore: KeyStore

  constructor(keystore: KeyStore) {
    this.keystore = keystore
  }

  fromJson = (json: string) => {
    this.keystore = JSON.parse(json)
  }

  toJson = () => {
    JSON.stringify(this.keystore)
  }
}

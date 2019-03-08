import bip32 from 'bip32'
import bip39 from 'bip39'
import { KeyStore, Child } from './keystore'
import Action from './action'

export default class Key implements Action {
  private keystore: KeyStore

  private mnemonic: string

  constructor(keystore: KeyStore, mnemonic: string) {
    this.keystore = keystore
    this.mnemonic = mnemonic
  }

  fromKeyStore = (keystore: KeyStore) => {
    return new Key(keystore, '')
  }

  fromKeyStoreJson = (json: string) => {
    return new Key(JSON.parse(json), '')
  }

  getKeyStore = () => this.keystore

  getKeyStoreJson = () => JSON.stringify(this.keystore)

  getMnemonic = () => this.mnemonic

  generateKey = () => {
    const mnemonic = bip39.generateMnemonic()
    return this.fromMnemonic(mnemonic, false)
  }

  fromMnemonic = (mnemonic: string, derive: boolean) => {
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    const master = {
      privateKey: root.privateKey.toString('hex'),
      chainCode: root.chainCode.toString('hex'),
    }
    const keystore: KeyStore = {
      master,
    }
    if (derive) {
      keystore.children = this.fetchUsedAddress()
    }
    return new Key(keystore, mnemonic)
  }

  // search vaild child private key and chain code
  private searchIterationForAddress = (
    index: number,
    maxUsedIndex: number = 0,
    minUnusedIndex: number = 100500100,
    depth: number = 0,
  ): number => {
    if (depth >= 20) return maxUsedIndex + 1
    let minUnusedIndexTemp = minUnusedIndex
    let maxUsedIndexTemp = maxUsedIndex
    let indexTemp = index
    // TODO
    const txs = ['fetch transactions of the address(index)']
    if (txs.length === 0) {
      if (indexTemp === 0) return 0
      minUnusedIndexTemp = Math.min(minUnusedIndexTemp, indexTemp)
      indexTemp = Math.floor((indexTemp - maxUsedIndexTemp) / 2 + maxUsedIndexTemp)
    } else {
      maxUsedIndexTemp = Math.max(maxUsedIndexTemp, indexTemp)
      // TODO
      const txs2 = ['fetch transactions of the address(index+1)']
      if (txs2.length === 0) return indexTemp + 1
      indexTemp = Math.round((minUnusedIndexTemp - indexTemp) / 2 + indexTemp)
    }
    return this.searchIterationForAddress(indexTemp, maxUsedIndexTemp, minUnusedIndexTemp, depth + 1)
  }

  private fetchUsedAddress = (): Child[] => {
    const depth = this.searchIterationForAddress(0)
    const children: Child[] = []
    for (let index = 0; index < depth; index++) {
      children.concat({
        path: 'path',
        depth: index,
        privateKey: 'privateKey',
        chainCode: 'chainCode',
      })
    }
    return children
  }
}

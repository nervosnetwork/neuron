import bip32 from 'bip32'
import bip39 from 'bip39'
import { KeyStore, Child } from './keystore'

export default class Key {
  private keystore: KeyStore

  private children: Child[] = []

  constructor(keystore: KeyStore) {
    this.keystore = keystore
  }

  fromKeyStoreJson = (json: string) => {
    this.keystore = JSON.parse(json)
  }

  toKeyStore = () => this.keystore

  toKeyStoreJson = () => JSON.stringify(this.keystore)

  fromMnemonic = (mnemonic: string, derive: boolean) => {
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    const master = {
      privateKey: root.privateKey.toString('hex'),
      chainCode: root.chainCode.toString('hex'),
    }
    this.keystore.master = master
    if (derive) {
      this.children = this.fetchUsedAddress()
    }
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
      this.children.concat({
        path: 'path',
        depth,
        privateKey: 'privateKey',
        chainCode: 'chainCode',
      })
      minUnusedIndexTemp = Math.min(minUnusedIndexTemp, indexTemp)
      indexTemp = Math.floor((indexTemp - maxUsedIndexTemp) / 2 + maxUsedIndexTemp)
    } else {
      maxUsedIndexTemp = Math.max(maxUsedIndexTemp, indexTemp)
      // TODO
      const txs2 = ['fetch transactions of the address(index+1)']
      if (txs2.length === 0) return indexTemp + 1
      this.children.concat({
        path: 'path',
        depth,
        privateKey: 'privateKey',
        chainCode: 'chainCode',
      })
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

import BaseStore from './store'
import { KeyStore } from '../keys/keystore'
import env from '../env'

const keyWalletName = 'WalletName'

// wallet name is exist
enum WalletStoreError {
  ExistWallet,
  NoWallet,
}

export interface Wallet {
  name: string
  keystore: KeyStore
}

export default class WalletStore extends BaseStore {
  constructor() {
    super({
      name: env.walletDBName,
    })
  }

  private getWalletNameList(): string[] {
    return this.get(keyWalletName, [])
  }

  saveWallet = (walletName: string, wallet: Wallet) => {
    if (this.store.has(walletName)) {
      throw WalletStoreError.ExistWallet
    } else {
      let nameList = this.getWalletNameList()
      this.save(walletName, wallet)
      nameList = nameList.concat(walletName)
      this.save(keyWalletName, nameList)
    }
  }

  getAllWallets = (): Wallet[] => {
    const walletList: Wallet[] = []
    const nameList = this.getWalletNameList()
    nameList.forEach(name => walletList.push(this.getWallet(name)))
    return walletList
  }

  getWallet = (walletName: string): Wallet => {
    const wallet = this.get(walletName, null)
    if (!wallet) {
      throw WalletStoreError.ExistWallet
    }
    return this.get(walletName)
  }

  renameWallet = (newName: string, oldName: string) => {
    const wallet = this.getWallet(oldName)
    wallet.name = newName
    this.saveWallet(newName, wallet)
    this.deleteWallet(oldName)
  }

  deleteWallet = (walletName: string) => {
    this.delete(walletName)
    const nameList = this.getWalletNameList()
    nameList.splice(nameList.indexOf(walletName), 1)
    this.save(keyWalletName, nameList)
  }

  clear() {
    this.store.clear()
  }

  path() {
    return this.store.path
  }

  storeAll(data: any) {
    this.store.store = data
  }
}

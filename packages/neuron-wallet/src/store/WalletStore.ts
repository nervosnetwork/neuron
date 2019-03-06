import BaseStore from './store'

const walletDBName = 'WalletDB'

const keyWalletName = 'WalletName'

// wallet name is exist
const WalletStoreError = {
  ExistKey: 'There is wallet named ',
}

export interface Wallet {
  name: string
  keystore: keyStore
}

export interface keyStore {
  // TODO
}

export default class WalletStore extends BaseStore {
  constructor() {
    super({
      name: walletDBName,
    })
  }

  private getWalletNameList(): string[] {
    return this.get(keyWalletName, [])
  }

  saveWallet = (walletName: string, wallet: Wallet) => {
    if (this.store.has(walletName)) {
      throw new Error(WalletStoreError.ExistKey + walletName)
    } else {
      let nameList = this.getWalletNameList()
      this.save(walletName, wallet)
      nameList = nameList.concat(walletName)
      this.save(keyWalletName, nameList)
    }
  }

  getAllWallets(): Wallet[] {
    const walletList: Wallet[] = []
    const nameList = this.getWalletNameList()
    nameList.forEach(name => walletList.push(this.getWallet(name)))
    return walletList
  }

  getWallet(walletName: string): Wallet {
    return this.get(walletName)
  }

  renameWallet(newName: string, oldName: string) {
    const wallet = this.getWallet(oldName)
    wallet.name = newName
    this.saveWallet(newName, wallet)
    this.deleteWallet(oldName)
  }

  deleteWallet(walletName: string) {
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

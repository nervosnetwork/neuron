/*
 * @Author: BaojunCZ
 * @LastEditors: your name
 * @Description: store wallet name and keystore
 * @Date: 2019-03-05 19:50:41
 * @LastEditTime: 2019-03-06 13:15:34
 */
import BaseStore from './store'

const walletDBName = 'NeuronWalletDB'

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

  getWalletNameList(): string[] {
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
}

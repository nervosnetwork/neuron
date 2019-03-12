import Store from 'electron-store'
import { v4 } from 'uuid'
import { Keystore } from '../keys/keystore'
import env from '../env'

const WalletIDKey = 'WalletID'

export enum WalletStoreError {
  NoWallet,
}

export interface WalletData {
  id: string
  name: string
  keystore: Keystore
}

interface Options {
  name?: string
  encryptionKey?: string | Buffer
}

export default class WalletStore {
  walletIDStore: Store

  constructor() {
    const idOptions: Options = {
      name: env.walletIDName,
      encryptionKey: env.storeEncryptKey,
    }
    this.walletIDStore = new Store(idOptions)
  }

  private getIDList = (): string[] => {
    return this.walletIDStore.get(WalletIDKey, [])
  }

  private setIDList = (list: string[]) => {
    this.walletIDStore.set(WalletIDKey, list)
  }

  private getWalletStore = (id: string): Store => {
    const options: Options = {
      name: id,
      encryptionKey: env.storeEncryptKey,
    }
    return new Store(options)
  }

  saveWallet = (walletName: string, walletKeystore: Keystore): string => {
    const walletId = v4()
    let idList = this.getIDList()
    const walletData = {
      id: walletId,
      name: walletName,
      keystore: walletKeystore,
    }
    idList = idList.concat(walletId)
    this.setIDList(idList)
    this.getWalletStore(walletId).set(walletId, walletData)
    return walletId
  }

  getWallet = (walletId: string): WalletData => {
    const wallet = this.getWalletStore(walletId).get(walletId, null)
    if (!wallet) {
      throw WalletStoreError.NoWallet
    }
    return wallet
  }

  getAllWallets = (): WalletData[] => {
    const walletList: WalletData[] = []
    const idList = this.getIDList()
    idList.forEach(id => {
      walletList.push(this.getWallet(id))
    })
    return walletList
  }

  renameWallet = (walletId: string, name: string) => {
    const wallet = this.getWallet(walletId)
    wallet.name = name
    this.getWalletStore(walletId).set(walletId, wallet)
  }

  deleteWallet = (walletId: string) => {
    const idList = this.getIDList()
    idList.splice(idList.indexOf(walletId), 1)
    this.setIDList(idList)
    this.getWalletStore(walletId).clear()
  }

  clearAll = () => {
    const idList = this.getIDList()
    idList.forEach(id => {
      this.getWalletStore(id).clear()
    })
    this.walletIDStore.clear()
  }
}

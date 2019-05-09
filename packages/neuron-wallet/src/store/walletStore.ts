import Store from 'electron-store'
import { Keystore } from '../keys/keystore'
import env from '../env'
import { Addresses } from '../keys/key'
import app from '../app'

export enum WalletStoreError {
  NoWallet,
  NoActiveWallet,
}

export interface WalletData {
  id: string
  name: string
  keystore: Keystore
  addresses: Addresses
}

interface Options {
  name?: string
  cwd?: string
  encryptionKey?: string | Buffer
}

const userDataPath = app.getPath('userData')
const storePath = env.isDevMode ? `${userDataPath}/dev/wallets` : `${userDataPath}/wallets`
const WalletIDKey = 'WalletID'
const ActiveWalletID = 'ActiveID'

export default class WalletStore {
  walletIDStore: Store

  constructor() {
    const idOptions: Options = {
      name: WalletIDKey,
      cwd: storePath,
    }
    this.walletIDStore = new Store(idOptions)
  }

  private getIDList = (): string[] => {
    return this.walletIDStore.get(WalletIDKey, []) as any
  }

  private addWalletID = (id: string) => {
    this.walletIDStore.set(WalletIDKey, this.getIDList().concat(id))
  }

  private removeWalletID = (id: string) => {
    const idList = this.getIDList()
    idList.splice(idList.indexOf(id), 1)
    this.walletIDStore.set(WalletIDKey, idList)
  }

  private getWalletStore = (id: string): Store => {
    const options: Options = {
      name: id,
      cwd: storePath,
    }
    return new Store(options)
  }

  saveWallet = (walletData: WalletData) => {
    this.addWalletID(walletData.id)
    this.getWalletStore(walletData.id).set(walletData.id, walletData)
    if (this.getIDList().length === 1) {
      this.setActiveWallet(walletData.id)
    }
  }

  getWallet = (walletId: string): WalletData => {
    const wallet = this.getWalletStore(walletId).get(walletId, null)
    if (!wallet) {
      throw WalletStoreError.NoWallet
    }
    return wallet as any
  }

  setActiveWallet = (walletId: string): boolean => {
    const index = this.getIDList().findIndex(id => id === walletId)
    if (index === -1) {
      return false
    }
    this.walletIDStore.set(ActiveWalletID, walletId)
    return true
  }

  getActiveWallet = (): WalletData => {
    const walletId = this.walletIDStore.get(ActiveWalletID, null) as string
    if (walletId) {
      return this.getWallet(walletId)
    }
    throw WalletStoreError.NoActiveWallet
  }

  getAllWallets = (): WalletData[] => {
    const walletList: WalletData[] = []
    const idList = this.getIDList()
    idList.forEach(id => {
      walletList.push(this.getWallet(id))
    })
    return walletList
  }

  update = (walletId: string, newWallet: WalletData) => {
    this.getWalletStore(walletId).set(walletId, newWallet)
  }

  deleteWallet = (walletId: string) => {
    const activeId = this.getActiveWallet().id
    this.removeWalletID(walletId)
    this.getWalletStore(walletId).clear()
    const idList = this.getIDList()
    if (idList.length > 0 && activeId === walletId) {
      this.setActiveWallet(idList[0])
    }
  }

  clearAll = () => {
    const idList = this.getIDList()
    idList.forEach(id => {
      this.getWalletStore(id).clear()
    })
    this.walletIDStore.clear()
  }
}

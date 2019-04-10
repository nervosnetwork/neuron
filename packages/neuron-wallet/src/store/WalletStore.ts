import Store from 'electron-store'
import { Keystore } from '../keys/keystore'
import env from '../env'
import { Addresses } from '../keys/key'
import app from '../app'

export enum WalletStoreError {
  NoWallet,
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
const storePath = env.isDevMode ? `${userDataPath}/dev` : userDataPath
const WalletIDKey = 'WalletID'

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
    return this.walletIDStore.get(WalletIDKey, [])
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

  updateAddresses = (walletId: string, addresses: Addresses) => {
    const wallet = this.getWallet(walletId)
    wallet.addresses = addresses
    this.getWalletStore(walletId).set(walletId, wallet)
  }

  deleteWallet = (walletId: string) => {
    this.removeWalletID(walletId)
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

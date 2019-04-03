import { remote, app } from 'electron'
import Store from 'electron-store'
import { Keystore } from '../keys/keystore'
import env from '../env'

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
  cwd?: string
  encryptionKey?: string | Buffer
}

const userDataPath = (app || remote.app).getPath('userData')
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

  private setIDList = (list: string[]) => {
    this.walletIDStore.set(WalletIDKey, list)
  }

  private getWalletStore = (id: string): Store => {
    const options: Options = {
      name: id,
      cwd: storePath,
    }
    return new Store(options)
  }

  saveWallet = (walletData: WalletData): string => {
    let idList = this.getIDList()
    idList = idList.concat(walletData.id)
    this.setIDList(idList)
    this.getWalletStore(walletData.id).set(walletData.id, walletData)
    return walletData.id
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

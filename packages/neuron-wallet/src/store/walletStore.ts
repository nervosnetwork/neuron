import fs from 'fs'
import { Keystore } from '../keys/keystore'
import env from '../env'
import { Addresses } from '../keys/key'
import app from '../app'
import Store from '../utils/store'

export enum WalletStoreError {
  NoWallet,
  NoActiveWallet,
}

export interface Wallet {
  id: string
  name: string
  keystore: Keystore
  addresses: Addresses
}

// TODO: Check if '/dev/wallets' path works on Windows
const defaultStorePath = env.isDevMode ? '/dev/wallets' : '/wallets'

export default class WalletStore {
  private storePath: string
  private listStore: Store // Save wallets (meta info except keystore, which is persisted separately)
  private walletsKey = 'wallets'
  private currentWalletKey = 'current'

  constructor(storePath: string = defaultStorePath) {
    this.storePath = `${app.getPath('userData')}/${storePath}`
    fs.mkdirSync(this.storePath, { recursive: true })
    this.listStore = new Store(this.storePath, 'wallets.json')
  }

  private getWalletStore = (id: string): Store => {
    return new Store(this.storePath, `${id}.json`)
  }

  getAllWallets = (): Wallet[] => {
    return this.listStore.readSync(this.walletsKey) || []
  }

  getWallet = (id: string): Wallet => {
    const wallets = this.getAllWallets()
    const wallet = wallets.find((w: Wallet) => w.id === id)
    if (!wallet) {
      throw WalletStoreError.NoWallet
    }
    return wallet as any
  }

  saveWallet = (wallet: Wallet) => {
    this.listStore.writeSync(this.walletsKey, this.getAllWallets().concat(wallet))
    // TODO: Save keystore to that store instead.
    this.getWalletStore(wallet.id).writeSync(wallet.id, wallet)
    if (this.getAllWallets().length === 1) {
      this.setCurrentWallet(wallet.id)
    }
  }

  updateWallet = (id: string, newWallet: Wallet) => {
    const wallets = this.getAllWallets()
    const index = wallets.findIndex((w: Wallet) => w.id === id)
    if (index !== -1) {
      wallets[index] = newWallet
      this.listStore.writeSync(this.walletsKey, wallets)
    } else {
      throw WalletStoreError.NoWallet
    }
    // TODO: Save keystore to that store instead.
    this.getWalletStore(id).writeSync(id, newWallet)
  }

  deleteWallet = (id: string) => {
    const currentId = this.getCurrentWallet().id
    const wallets = this.getAllWallets()
    const index = wallets.findIndex((w: Wallet) => w.id === id)
    if (index !== -1) {
      wallets.splice(index, 1)
      this.listStore.writeSync(this.walletsKey, wallets)
    } else {
      throw WalletStoreError.NoWallet
    }
    this.getWalletStore(id).clear()

    if (currentId === id) {
      this.setCurrentWallet(this.getAllWallets()[0].id)
    }
  }

  setCurrentWallet = (walletId: string): boolean => {
    const index = this.getAllWallets().findIndex((w: Wallet) => w.id === walletId)
    if (index === -1) {
      return false
    }
    this.listStore.writeSync(this.currentWalletKey, walletId)
    return true
  }

  getCurrentWallet = (): Wallet => {
    const walletId = this.listStore.readSync(this.currentWalletKey) as string
    if (walletId) {
      return this.getWallet(walletId)
    }
    throw WalletStoreError.NoActiveWallet
  }

  clearAll = () => {
    this.getAllWallets().forEach(w => {
      this.getWalletStore(w.id).clear()
    })
    this.listStore.clear()
  }
}

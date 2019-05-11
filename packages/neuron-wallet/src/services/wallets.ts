import fs from 'fs'
import { v4 as uuid } from 'uuid'
import Key, { Addresses } from '../keys/key'
import { Keystore } from '../keys/keystore'
import app from '../app'
import env from '../env'
import Store from '../utils/store'

export interface Wallet {
  id: string
  name: string
  keystore: Keystore
  addresses: Addresses

  // TODO: add explictly keystore loading func
  // loadKeystore: () => Keystore
}

export interface WalletProperties {
  name: string
  keystore: Keystore
  addresses: Addresses
}

// TODO: Check if '/dev/wallets' path works on Windows
const defaultStorePath = env.isDevMode ? '/dev/wallets' : '/wallets'

export default class WalletService {
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

  public getAll = (): Wallet[] => {
    return this.listStore.readSync(this.walletsKey) || []
  }

  public get = (id: string): Wallet | undefined => {
    return this.getAll().find(wallet => wallet.id === id)
  }

  public create = (prop: WalletProperties): Wallet => {
    const wallet = { ...prop, id: uuid() }
    this.listStore.writeSync(this.walletsKey, this.getAll().concat(wallet))
    // TODO: Save keystore to that store instead.
    this.getWalletStore(wallet.id).writeSync(wallet.id, wallet)
    if (this.getAll().length === 1) {
      this.setCurrent(wallet.id)
    }
    return wallet
  }

  public update = (id: string, prop: WalletProperties) => {
    const wallets = this.getAll()
    const index = wallets.findIndex((w: Wallet) => w.id === id)
    if (index !== -1) {
      wallets[index] = { ...prop, id }
      this.listStore.writeSync(this.walletsKey, wallets)
    }
  }

  public delete = (id: string): boolean => {
    const current = this.getCurrent()
    const currentId = current ? current.id : ''
    const wallets = this.getAll()
    const index = wallets.findIndex((w: Wallet) => w.id === id)
    if (index === -1) {
      return false
    }

    wallets.splice(index, 1)
    this.listStore.writeSync(this.walletsKey, wallets)
    this.getWalletStore(id).clear()

    const newWallets = this.getAll()
    if (currentId === id && newWallets.length > 0) {
      this.setCurrent(newWallets[0].id)
    }

    return true
  }

  public setCurrent = (id: string): boolean => {
    const wallet = this.get(id)
    if (wallet) {
      this.listStore.writeSync(this.currentWalletKey, id)
      return true
    }
    return false
  }

  public getCurrent = (): Wallet | undefined => {
    const walletId = this.listStore.readSync(this.currentWalletKey) as string
    if (walletId) {
      return this.get(walletId)
    }
    return undefined
  }

  public validate = ({ id, password }: { id: string; password: string }) => {
    const wallet = this.get(id)
    if (wallet) {
      const key = new Key({ keystore: wallet.keystore })
      return key.checkPassword(password)
    }

    // TODO: Throw wallet not found instead.
    return false
  }

  public clearAll = () => {
    this.getAll().forEach(w => {
      this.getWalletStore(w.id).clear()
    })
    this.listStore.clear()
  }
}

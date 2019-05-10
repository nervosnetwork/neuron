import { v4 } from 'uuid'
import WalletStore, { WalletData } from '../store/walletStore'
import Key, { Addresses } from '../keys/key'
import { Keystore } from '../keys/keystore'

const walletStore = new WalletStore()

export default class WalletService {
  public getAll = (): WalletData[] => {
    return walletStore.getAllWallets()
  }

  public get = (id: string): WalletData | undefined => {
    return this.getAll().find(wallet => wallet.id === id)
  }

  public create = ({
    name,
    keystore,
    addresses,
  }: {
    name: string
    keystore: Keystore
    addresses: Addresses
  }): WalletData => {
    const id = v4()
    walletStore.saveWallet({ id, name, keystore, addresses })
    return { id, name, keystore, addresses }
  }

  public validate = ({ id, password }: { id: string; password: string }) => {
    const wallet = walletStore.getWallet(id)
    const key = new Key({ keystore: wallet.keystore })
    return key.checkPassword(password)
  }

  public update = (walletId: string, newWallet: WalletData) => {
    const currentWallet = walletStore.getWallet(walletId)
    walletStore.updateWallet(walletId, { ...currentWallet, ...newWallet })
  }

  public delete = (id: string): boolean => {
    const wallet = this.get(id)
    if (wallet) {
      walletStore.deleteWallet(id)
      return true
    }
    return false
  }

  public setActive = (id: string): boolean => {
    return walletStore.setCurrentWallet(id)
  }

  public getActive = (): WalletData => {
    return walletStore.getCurrentWallet()
  }
}

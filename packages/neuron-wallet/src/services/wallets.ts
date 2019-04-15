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

  // TODO: update wallet
  // public update = ({
  //   id,
  //   name,
  //   address,
  //   publicKey,
  // }: {
  //   id: string
  //   name?: string
  //   address?: string
  //   publicKey?: Uint8Array
  // }): boolean => {
  //   const wallet = this.show(id)
  //   if (wallet) {
  //     if (name) {
  //       wallet.name = name
  //     }
  //     if (address) {
  //       wallet.address = address
  //     }
  //     if (publicKey) {
  //       wallet.publicKey = publicKey
  //     }
  //     return true
  //   }
  //   return false
  // }

  public delete = (id: string): boolean => {
    const wallet = this.get(id)
    if (wallet) {
      walletStore.deleteWallet(id)
      return true
    }
    return false
  }

  public setActive = (id: string): boolean => {
    return walletStore.setActiveWallet(id)
  }

  public getActive = (): WalletData => {
    return walletStore.getActiveWallet()
  }
}

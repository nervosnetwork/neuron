import Store from 'electron-store'
import env from '../env'
import app from '../app'
import { Addresses } from '../keys/key'

export enum AddressStoreError {
  NoWallet,
  NoAddress,
}

export interface WalletAddress {
  id: string
  addresses: Addresses
}

interface Options {
  name?: string
  cwd?: string
  encryptionKey?: string | Buffer
}

const userDataPath = app.getPath('userData')
const storePath = env.isDevMode ? `${userDataPath}/dev/store/address` : `${userDataPath}/store/address`
const WALLET_ID_KEY = 'wallet_id'

export default class AddressStore {
  walletIdStore: Store

  constructor() {
    const idOptions: Options = {
      name: WALLET_ID_KEY,
      cwd: storePath,
    }
    this.walletIdStore = new Store(idOptions)
  }

  saveWalletAddresses = (walletAddress: WalletAddress) => {
    this.addWalletId(walletAddress.id)
    this.walletAddressStore(walletAddress.id).set(walletAddress.id, walletAddress)
  }

  walletAddresses = (id: string): string[] => {
    const walletAddress = this.walletAddressById(id)
    if (!walletAddress) {
      throw AddressStoreError.NoWallet
    }
    const addresses: string[] = []
    walletAddress.addresses.change.forEach(hdAddress => {
      addresses.push(hdAddress.address)
    })
    walletAddress.addresses.receiving.forEach(hdAddress => {
      addresses.push(hdAddress.address)
    })
    return addresses
  }

  allAddresses = (): string[] => {
    const addresses: string[] = []
    const walletIds = this.walletIds()
    walletIds.forEach(id => {
      const walletAddress = this.walletAddressById(id)
      walletAddress.addresses.change.forEach(hdAddress => {
        addresses.push(hdAddress.address)
      })
      walletAddress.addresses.receiving.forEach(hdAddress => {
        addresses.push(hdAddress.address)
      })
    })
    return addresses
  }

  updateWalletAddresses = (id: string, walletAddress: WalletAddress) => {
    this.walletAddressStore(id).set(id, walletAddress)
  }

  deleteWalletAddresses = (id: string) => {
    this.removeWalletId(id)
    this.walletAddressStore(id).clear()
  }

  clearAllAddresses = () => {
    const idList = this.walletIds()
    idList.forEach(id => {
      this.walletAddressStore(id).clear()
    })
    this.walletIdStore.clear()
  }

  private walletIds = (): string[] => {
    return this.walletIdStore.get(WALLET_ID_KEY, [])
  }

  private addWalletId = (id: string) => {
    this.walletIdStore.set(WALLET_ID_KEY, this.walletIds().concat(id))
  }

  private removeWalletId = (id: string) => {
    const walletIds = this.walletIds()
    walletIds.splice(walletIds.indexOf(id), 1)
    this.walletIdStore.set(WALLET_ID_KEY, walletIds)
  }

  private walletAddressStore = (id: string): Store => {
    const options: Options = {
      name: id,
      cwd: storePath,
    }
    return new Store(options)
  }

  private walletAddressById = (id: string): WalletAddress => {
    return this.walletAddressStore(id).get(id, null)
  }
}

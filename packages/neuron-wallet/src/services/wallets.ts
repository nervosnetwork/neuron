import asw from '../wallets/asw'
import WalletStore from '../store/WalletStore'
import Key from '../keys/key'
import { Keystore } from '../keys/keystore'

const walletStore = new WalletStore()

export interface Wallet {
  id: string
  name: string
  address?: string
  publicKey?: Uint8Array
}

// this should come from config or db
export const defaultWallet: Wallet = {
  id: '0',
  name: 'asw',
  address: asw.address,
  publicKey: asw.publicKey,
}

export default class WalletService {
  public wallets: Wallet[] = []

  public active: Wallet | undefined = undefined

  constructor() {
    const keystoreJson =
      '{"version":0,"id":"e24843a9-ff71-4165-be2f-fc435f62635c","crypto":{"ciphertext":"c671676b15e35107091318582186762c8ce11e7fc03cdd13efe7099985d94355a60477ddf2ff39b0054233cbcbefc297f1521094db1b473c095c9c3b9c143a0ad80c6806e14596bd438994a025ed76187350ae216d1b411f54f31c5beec989efdcb42ad673cda64d753dc876ed47da8cf65f4b45eded003b5a3a9a8f62dd69890bec62aaae6eeded75f650109f2d700db74515eaed5f3d401b59b02cd0518899","cipherparams":{"iv":"c210625979883ad1b6f90e7fb3f5b70d"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"54257d76bb23cbe83220f2bc267f98a69a3e1624d62e94f5bcbba9a8df34ec14","n":8192,"r":8,"p":1},"mac":"88b415ff1651bf94ce7fbc82a72a6fcd7e095cd763e8f726ef7bea4ccb028b00"}}'

    this.create({
      name: 'asw',
      keystore: JSON.parse(keystoreJson),
    })
    this.setActive(walletStore.getAllWallets()[0].id)
  }

  public index = (
    { pageNo = 0, pageSize = 15 }: { pageNo: number; pageSize: number } = { pageNo: 0, pageSize: 15 },
  ): Wallet[] => {
    return walletStore
      .getAllWallets()
      .slice(pageNo * pageSize, (pageNo + 1) * pageSize)
      .map(w => ({
        id: w.id,
        name: w.name,
        address: `address of ${w.id}`,
        publicKey: Buffer.from(`address of ${w.id}`),
      }))
  }

  public show = (id: string): Wallet | undefined => {
    return this.wallets.find(wallet => wallet.id === id)
  }

  public create = ({ name, keystore }: { name: string; keystore: Keystore }): Wallet => {
    const id = walletStore.saveWallet(name, keystore)
    if (id) {
      const storedWallet = walletStore.getWallet(id)
      return {
        id,
        name: storedWallet.name,
      }
    }
    throw new Error('Failed to create wallet')
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
    const wallet = this.show(id)
    if (wallet) {
      this.wallets = this.wallets.filter(w => w.id !== id)
      walletStore.deleteWallet(id)
      return true
    }
    return false
  }

  public setActive = (id: string): boolean => {
    const wallet = this.show(id)
    if (wallet) {
      this.active = wallet
      return true
    }
    return false
  }
}

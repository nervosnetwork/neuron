import { v4 } from 'uuid'

import ckbCore from '../core'
import TransactionsService from './transactions'
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
    const index = walletStore.getAllWallets().findIndex(wallet => wallet.name === name)
    if (index !== -1) {
      throw Error('Wallet name existed')
    }
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
    walletStore.update(walletId, { ...currentWallet, ...newWallet })
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
    return walletStore.setActiveWallet(id)
  }

  public getActive = (): WalletData => {
    return walletStore.getActiveWallet()
  }

  /**
   * transactions related
   */
  public sendCapacity = async (
    items: {
      address: CKBComponents.Hash256
      capacity: CKBComponents.Capacity
      unit: 'byte' | 'shannon'
    }[],
    password: string,
  ) => {
    // TODO: verify password
    if (!password) {
      throw new Error('Incorrect password')
    }

    const changeAddress = walletStore.getActiveWallet().addresses.change[0].address

    // TODO: this is always success code hash, should be replaced in the future
    const codeHash = '0x0000000000000000000000000000000000000000000000000000000000000001'

    const lockhashes = items.map(({ address }) =>
      ckbCore.utils.lockScriptToHash({
        // TODO: binaryHash has be updated to codeHash with sdk@0.11.0
        binaryHash: codeHash,
        args: [ckbCore.utils.blake160(address)],
      }),
    )
    const targetOutputs = items.map(item => ({
      ...item,
      capacity: (BigInt(item.capacity) * (item.unit === 'byte' ? BigInt(1) : BigInt(10 ** 8))).toString(),
    }))

    const transaction = (await TransactionsService.generateTx(
      lockhashes,
      targetOutputs,
      changeAddress,
    )) as CKBComponents.RawTransaction
    return ckbCore.rpc.sendTransaction(transaction)
  }
}

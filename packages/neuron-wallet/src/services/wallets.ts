import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import TransactionsService from './transactions'
import Key, { Addresses } from '../keys/key'
import { Keystore } from '../keys/keystore'
import app from '../app'
import env from '../env'
import Store from '../utils/store'
import nodeService from '../startup/nodeService'

const { core } = nodeService

export interface Wallet {
  id: string
  name: string
  addresses: Addresses

  loadKeystore: () => Keystore
}

export interface WalletProperties {
  name: string
  addresses: Addresses
  keystore: Keystore | null
}

class FileKeystoreWallet implements Wallet {
  id: string
  name: string
  addresses: Addresses

  private storePath: string

  constructor(id: string, props: WalletProperties, storePath: string) {
    this.id = id

    this.name = props.name
    this.addresses = props.addresses

    this.storePath = storePath
  }

  static fromJSON = (
    json: { id: string; name: string; addresses: Addresses },
    storePath: string,
  ): FileKeystoreWallet => {
    const props = { name: json.name, addresses: json.addresses, keystore: null }
    return new FileKeystoreWallet(json.id, props, storePath)
  }

  update = (props: WalletProperties) => {
    this.name = props.name
    this.addresses = props.addresses
  }

  toJSON = (): any => {
    return {
      id: this.id,
      name: this.name,
      addresses: this.addresses,
    }
  }

  loadKeystore = (): Keystore => {
    // TODO: handle fs error
    const data = fs.readFileSync(this.storeLocation(), { encoding: 'utf8' })
    return JSON.parse(data) as Keystore
  }

  private storeLocation = (): string => {
    return path.resolve(this.storePath, `${this.id}.json`)
  }

  saveKeystore = (keystore: Keystore) => {
    fs.writeFileSync(this.storeLocation(), JSON.stringify(keystore), { encoding: 'utf8' })
  }

  deleteKeystore = () => {
    fs.unlinkSync(this.storeLocation())
  }
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

  public getAll = (): Wallet[] => {
    return this.listStore.readSync(this.walletsKey) || []
  }

  public get = (id: string): Wallet | undefined => {
    const wallet = this.getAll().find(w => w.id === id)
    if (wallet) {
      return FileKeystoreWallet.fromJSON(wallet, this.storePath)
    }
    return undefined
  }

  public create = (props: WalletProperties): Wallet => {
    const index = this.getAll().findIndex(wallet => wallet.name === props.name)
    if (index !== -1) {
      throw Error('Wallet name existed')
    }
    const wallet = new FileKeystoreWallet(uuid(), props, this.storePath)
    wallet.saveKeystore(props.keystore!)
    this.listStore.writeSync(this.walletsKey, this.getAll().concat(wallet.toJSON()))
    if (this.getAll().length === 1) {
      this.setCurrent(wallet.id)
    }
    return wallet
  }

  public update = (id: string, props: WalletProperties) => {
    const wallets = this.getAll()
    const index = wallets.findIndex((w: Wallet) => w.id === id)
    if (index !== -1) {
      const wallet = FileKeystoreWallet.fromJSON(wallets[index], this.storePath)
      if (wallet.name !== props.name && wallets.findIndex(storeWallet => storeWallet.name === props.name) !== -1) {
        throw Error('Wallet name existed')
      }
      wallet.update(props)
      if (props.keystore) {
        wallet.saveKeystore(props.keystore)
      }
      wallets[index] = wallet.toJSON()
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

    const wallet = FileKeystoreWallet.fromJSON(wallets[index], this.storePath)
    wallets.splice(index, 1)
    this.listStore.writeSync(this.walletsKey, wallets)
    wallet.deleteKeystore()

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
      const key = new Key({ keystore: wallet.loadKeystore() })
      return key.checkPassword(password)
    }

    // TODO: Throw wallet not found instead.
    return false
  }

  public clearAll = () => {
    this.getAll().forEach(w => {
      const wallet = FileKeystoreWallet.fromJSON(w, this.storePath)
      wallet.deleteKeystore()
    })
    this.listStore.clear()
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

    // TODO: should pass in wallet id instead of accessing current wallet directly
    const changeAddress = this.getCurrent()!.addresses.change[0].address

    // TODO: this is always success code hash, should be replaced in the future
    const codeHash = '0x0000000000000000000000000000000000000000000000000000000000000001'

    const lockhashes = items.map(({ address }) =>
      core.utils.lockScriptToHash({
        // TODO: binaryHash has be updated to codeHash with sdk@0.11.0
        binaryHash: codeHash,
        args: [core.utils.blake160(address)],
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
    return core.rpc.sendTransaction(transaction)
  }
}

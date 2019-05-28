import { v4 as uuid } from 'uuid'
import { fromEvent } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import TransactionsService from './transactions'
import Key, { Addresses } from '../keys/key'
import { Keystore } from '../keys/keystore'
import Store from '../utils/store'
import nodeService from '../startup/nodeService'
import fileService from '../startup/fileService'
import LockUtils from '../utils/lockUtils'
import env from '../env'
import i18n from '../utils/i18n'
import windowManage from '../utils/windowManage'
import WalletsMethod from '../controllers/wallets/methods'
import { Channel, ResponseCode } from '../utils/const'

const { core } = nodeService

const hrp = `01${Buffer.from('P2PH').toString('hex')}`

const MODULE_NAME = 'wallets'
const DEBOUNCE_TIME = 50

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
  public id: string
  public name: string
  public addresses: Addresses

  constructor(id: string, { name, addresses }: WalletProperties) {
    if (id === undefined) throw new Error(i18n.t('is-required', { field: 'id' }))
    if (name === undefined) throw new Error(i18n.t('is-required', { field: 'name' }))
    if (addresses === undefined) throw new Error(i18n.t('is-required', { field: 'addresses' }))

    this.id = id
    this.name = name
    this.addresses = addresses
  }

  static fromJSON = (json: Pick<Wallet, Exclude<keyof Wallet, 'loadKeystore'>>) => {
    return new FileKeystoreWallet(json.id, {
      name: json.name,
      addresses: json.addresses,
      keystore: null,
    })
  }

  public update = ({ name, addresses }: WalletProperties) => {
    if (name) {
      this.name = name
    }
    if (addresses) {
      this.addresses = addresses
    }
  }

  public toJSON = (): Pick<Wallet, 'id' | 'name' | 'addresses'> => {
    return {
      id: this.id,
      name: this.name,
      addresses: this.addresses,
    }
  }

  public loadKeystore = () => {
    const data = fileService.readFileSync(MODULE_NAME, this.keystoreFileName())
    return JSON.parse(data) as Keystore
  }

  saveKeystore = (keystore: Keystore) => {
    fileService.writeFileSync(MODULE_NAME, this.keystoreFileName(), JSON.stringify({ ...keystore, id: this.id }))
  }

  deleteKeystore = () => {
    fileService.deleteFileSync(MODULE_NAME, this.keystoreFileName())
  }

  keystoreFileName = () => {
    return `${this.id}.json`
  }
}

export default class WalletService {
  private listStore: Store // Save wallets (meta info except keystore, which is persisted separately)
  private walletsKey = 'wallets'
  private currentWalletKey = 'current'

  constructor() {
    this.listStore = new Store(MODULE_NAME, 'wallets.json')

    fromEvent<[any, Pick<Wallet, 'id' | 'name' | 'addresses'>[]]>(this.listStore, this.walletsKey)
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(([, wallets]) => {
        const result = wallets.map(({ id, name }) => ({ id, name }))
        windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, {
          status: ResponseCode.Success,
          result,
        })
        const wallet = this.getCurrent()
        if (wallet) {
          const currentWallet = wallet.toJSON()
          windowManage.broadcast(Channel.Wallets, WalletsMethod.GetActive, {
            status: ResponseCode.Success,
            result: {
              id: currentWallet.id,
              name: currentWallet.name,
              addresses: {
                receiving: currentWallet.addresses.receiving.map(addr => addr.address),
                change: currentWallet.addresses.change.map(addr => addr.address),
              },
            },
          })
        }
      })

    fromEvent(this.listStore, this.currentWalletKey)
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(([, newId]) => {
        if (newId === undefined) return
        const currentWallet = this.get(newId).toJSON()
        windowManage.broadcast(Channel.Wallets, WalletsMethod.GetActive, {
          status: ResponseCode.Success,
          result: {
            id: currentWallet.id,
            name: currentWallet.name,
            addresses: {
              receiving: currentWallet.addresses.receiving.map(addr => addr.address),
              change: currentWallet.addresses.change.map(addr => addr.address),
            },
          },
        })
      })
  }

  public getAll = (): Pick<Wallet, Exclude<keyof Wallet, 'loadKeystore'>>[] => {
    return this.listStore.readSync(this.walletsKey) || []
  }

  public get = (id: string) => {
    if (id === undefined) throw new Error(i18n.t('is-required', { field: 'id' }))

    const wallet = this.getAll().find(w => w.id === id)
    if (!wallet) throw new Error(i18n.t('messages.wallet-is-not-found', { id }))

    return FileKeystoreWallet.fromJSON(wallet)
  }

  public create = (props: WalletProperties) => {
    if (!props) throw new Error(i18n.t('is-required', { field: 'wallet property' }))

    const index = this.getAll().findIndex(wallet => wallet.name === props.name)

    if (index !== -1) throw Error(i18n.t('messages.wallet-name-existed', { name: props.name }))

    const wallet = new FileKeystoreWallet(uuid(), props)

    wallet.saveKeystore(props.keystore!)

    this.listStore.writeSync(this.walletsKey, [...this.getAll(), wallet.toJSON()])

    if (this.getAll().length === 1) {
      this.setCurrent(wallet.id)
    }
    return wallet
  }

  public update = (id: string, props: WalletProperties) => {
    const wallets = this.getAll()
    const index = wallets.findIndex((w: Wallet) => w.id === id)
    if (index === -1) throw new Error(i18n.t('messages.wallet-is-not-found', { id }))

    const wallet = FileKeystoreWallet.fromJSON(wallets[index])

    if (wallet.name !== props.name && wallets.findIndex(storeWallet => storeWallet.name === props.name) !== -1) {
      throw Error(i18n.t('messages.wallet-name-existed', { name: props.name }))
    }

    wallet.update(props)

    if (props.keystore) {
      wallet.saveKeystore(props.keystore)
    }
    wallets[index] = wallet.toJSON()
    this.listStore.writeSync(this.walletsKey, wallets)
  }

  public delete = (id: string) => {
    const wallets = this.getAll()
    const walletJSON = wallets.find(w => w.id === id)
    const current = this.getCurrent()
    const currentId = current ? current.id : ''

    if (!walletJSON) throw new Error(i18n.t('messages.wallet-is-not-found', { id }))

    const wallet = FileKeystoreWallet.fromJSON(walletJSON)

    const newWallets = wallets.filter(w => w.id !== id)

    if (currentId === id) {
      if (newWallets.length > 0) {
        this.setCurrent(newWallets[0].id)
      } else {
        this.listStore.clear()
      }
    }

    this.listStore.writeSync(this.walletsKey, newWallets)
    wallet.deleteKeystore()
  }

  public setCurrent = (id: string) => {
    if (id === undefined) throw new Error(i18n.t('is-required', { field: 'id' }))

    const wallet = this.get(id)
    if (!wallet) throw new Error(i18n.t('messages.wallet-is-not-found', { id }))

    this.listStore.writeSync(this.currentWalletKey, id)
  }

  public getCurrent = () => {
    const walletId = this.listStore.readSync(this.currentWalletKey) as string
    if (walletId) {
      return this.get(walletId)
    }
    return undefined
  }

  public validate = ({ id, password }: { id: string; password: string }) => {
    const wallet = this.get(id)
    if (!wallet) throw new Error(i18n.t('messages.wallet-is-not-found', { id }))

    const key = new Key({ keystore: wallet.loadKeystore() })
    return key.checkPassword(password)
  }

  public clearAll = () => {
    this.getAll().forEach(w => {
      const wallet = FileKeystoreWallet.fromJSON(w)
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
    const wallet = await this.getCurrent()
    if (!wallet) throw new Error(i18n.t('messages.current-wallet-is-not-found'))

    if (password === undefined || password === '')
      throw new Error(i18n.t('messages.is-required', { field: 'password' }))

    const key = new Key({ keystore: wallet.loadKeystore() })

    if (!key.checkPassword(password)) throw new Error(i18n.t('messages.password-is-incorrect'))
    if (!key.keysData) throw new Error(i18n.t('messages.current-key-has-no-data'))

    const { privateKey } = key.keysData

    const addrObj = core.generateAddress(privateKey)

    const changeAddress = wallet.addresses.change[0].address

    const { codeHash } = await LockUtils.systemScript()
    if (!codeHash) throw new Error(i18n.t('messages.codehash-is-not-loaded'))

    const lockHashes = items.map(({ address }) => {
      // TODO: identifier will be a property of addressObj in SDK@0.13.0
      const identifier = core.utils.parseAddress(
        address,
        env.testnet ? core.utils.AddressPrefix.Testnet : core.utils.AddressPrefix.Mainnet,
        'hex',
      ) as string
      if (!identifier.startsWith(hrp)) throw new Error(i18n.t('messages.address-is-invalid', { address }))
      return core.utils.lockScriptToHash({
        codeHash,
        args: [identifier.slice(10)],
      })
    })

    const targetOutputs = items.map(item => ({
      ...item,
      capacity: (BigInt(item.capacity) * (item.unit === 'byte' ? BigInt(1) : BigInt(100_000_000))).toString(),
    }))

    const rawTransaction = await TransactionsService.generateTx(lockHashes, targetOutputs, changeAddress)

    const txHash = await (core.rpc as any).computeTransactionHash(rawTransaction)
    const signature = addrObj.sign(txHash)
    const signatureSize = core.utils.hexToBytes(signature).length
    const sequence = new DataView(new ArrayBuffer(8))
    sequence.setUint8(0, signatureSize)
    const sequencedSignatureSize = Buffer.from(sequence.buffer).toString('hex')
    const witness = {
      data: [`0x${addrObj.publicKey}`, `0x${signature}`, `0x${sequencedSignatureSize}`],
    }
    const witnesses = Array.from(
      {
        length: rawTransaction.inputs.length,
      },
      () => witness,
    )
    rawTransaction.witnesses = witnesses
    const realTxHash = await core.rpc.sendTransaction(rawTransaction)

    TransactionsService.txSentSubject.next({
      transaction: rawTransaction,
      txHash: realTxHash,
    })

    return txHash
  }
}

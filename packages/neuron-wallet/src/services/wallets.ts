import { v4 as uuid } from 'uuid'
import { fromEvent } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import TransactionsService from './transactions'
import Key, { Addresses } from '../keys/key'
import { Keystore } from '../keys/keystore'
import Store from '../utils/store'
import NodeService from './node'
import FileService from './file'
import LockUtils from '../utils/lock-utils'
import windowManage from '../utils/window-manage'
import { Channel, ResponseCode } from '../utils/const'
import { CurrentWalletNotSet, WalletNotFound, IsRequired, UsedName } from '../exceptions'
import { Witness, TransactionWithoutHash, Input } from '../app-types/types'
import ConvertTo from '../app-types/convert-to'
import Blake2b from '../utils/blake2b'

const { core } = NodeService.getInstance()
const fileService = FileService.getInstance()

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
    if (id === undefined) throw new IsRequired('ID')
    if (name === undefined) throw new IsRequired('Name')
    if (addresses === undefined) throw new IsRequired('Addresses')

    this.id = id
    this.name = name
    this.addresses = addresses
  }

  static fromJSON = (json: Omit<Wallet, 'loadKeystore'>) => {
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

  public toJSON = (): Omit<Wallet, 'loadKeystore'> => {
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
  private static instance: WalletService
  private listStore: Store // Save wallets (meta info except keystore, which is persisted separately)
  private walletsKey = 'wallets'
  private currentWalletKey = 'current'

  public static getInstance = () => {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService()
    }
    return WalletService.instance
  }

  constructor() {
    this.listStore = new Store(MODULE_NAME, 'wallets.json')

    fromEvent<[any, Omit<Wallet, 'loadKeystore'>[]]>(this.listStore, this.walletsKey)
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(([, wallets]) => {
        const result = wallets.map(({ id, name }) => ({ id, name }))
        windowManage.broadcast(Channel.Wallets, 'getAll', {
          status: ResponseCode.Success,
          result,
        })
        const wallet = this.getCurrent()
        if (wallet) {
          const currentWallet = wallet.toJSON()
          windowManage.broadcast(Channel.Wallets, 'getActive', {
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
        windowManage.broadcast(Channel.Wallets, 'getActive', {
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

  public getAll = (): Omit<Wallet, 'loadKeystore'>[] => {
    return this.listStore.readSync(this.walletsKey) || []
  }

  public get = (id: string) => {
    if (id === undefined) throw new IsRequired('ID')

    const wallet = this.getAll().find(w => w.id === id)
    if (!wallet) throw new WalletNotFound(id)

    return FileKeystoreWallet.fromJSON(wallet)
  }

  public create = (props: WalletProperties) => {
    if (!props) throw new IsRequired('wallet property')

    const index = this.getAll().findIndex(wallet => wallet.name === props.name)

    if (index !== -1) throw new UsedName('Wallet')

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
    if (index === -1) throw new WalletNotFound(id)

    const wallet = FileKeystoreWallet.fromJSON(wallets[index])

    if (wallet.name !== props.name && wallets.findIndex(storeWallet => storeWallet.name === props.name) !== -1) {
      throw new UsedName('Wallet')
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

    if (!walletJSON) throw new WalletNotFound(id)

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
    if (id === undefined) throw new IsRequired('ID')

    const wallet = this.get(id)
    if (!wallet) throw new WalletNotFound(id)

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
    if (!wallet) throw new WalletNotFound(id)

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
      address: string
      capacity: string
    }[],
    password: string
  ) => {
    const wallet = await this.getCurrent()
    if (!wallet) throw new CurrentWalletNotSet()

    if (password === undefined || password === '') throw new IsRequired('Password')

    const addressInfos = this.getAddressInfo()

    const addresses: string[] = addressInfos.map(info => info.address)

    const lockHashes: string[] = await Promise.all(addresses.map(async addr => LockUtils.addressToLockHash(addr)))

    const targetOutputs = items.map(item => ({
      ...item,
      capacity: (BigInt(item.capacity) * BigInt(1)).toString(),
    }))

    const changeAddress: string = this.getChangeAddress()

    const tx: TransactionWithoutHash = await TransactionsService.generateTx(lockHashes, targetOutputs, changeAddress)

    const txHash: string = await (core.rpc as any).computeTransactionHash(ConvertTo.toSdkTxWithoutHash(tx))

    const { inputs } = tx

    const witnesses: Witness[] = inputs!.map((input: Input) => {
      const blake160: string = input.lock!.args![0]
      const info = addressInfos.find(i => i.blake160 === blake160)
      const { path } = info!
      const privateKey = this.getPrivateKey(path)
      const witness = this.signWitness({ data: [] }, privateKey, txHash)
      return witness
    })

    tx.witnesses = witnesses

    const txToSend = ConvertTo.toSdkTxWithoutHash(tx)
    await core.rpc.sendTransaction(txToSend)

    TransactionsService.txSentSubject.next({
      transaction: tx,
      txHash,
    })

    return txHash
  }

  public getAddressInfo = () => {
    const item = {
      pubkey: '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01',
      address: 'ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf',
      blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
      path: '',
    }
    return [item]
  }

  public getChangeAddress = (): string => {
    return 'ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf'
  }

  public signWitness = (witness: Witness, privateKey: string, txHash: string): Witness => {
    const addrObj = core.generateAddress(privateKey)
    const oldData = witness.data
    const blake2b = new Blake2b()
    blake2b.update(txHash)
    oldData.forEach(data => {
      blake2b.update(data)
    })
    const message = blake2b.digest()
    const signature = `0x${addrObj.sign(message)}`
    const newWitness: Witness = {
      data: [`0x${addrObj.publicKey}`, signature],
    }
    return newWitness
  }

  public getPrivateKey = (path: string): string => {
    if (path !== '') {
      throw new Error('')
    }
    return '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3'
  }
}

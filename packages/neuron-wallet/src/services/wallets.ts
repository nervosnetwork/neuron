import { v4 as uuid } from 'uuid'
import { fromEvent } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import TransactionsService from './transactions'
import { AccountExtendedPublicKey, PathAndPrivateKey } from '../models/keys/key'
import Keystore from '../models/keys/keystore'
import Store from '../utils/store'
import NodeService from './node'
import FileService from './file'
import LockUtils from '../utils/lock-utils'
import windowManage from '../utils/window-manage'
import { Channel, ResponseCode } from '../utils/const'
import { Witness, TransactionWithoutHash, Input } from '../app-types/types'
import ConvertTo from '../app-types/convert-to'
import Blake2b from '../utils/blake2b'
import { CurrentWalletNotSet, WalletNotFound, IsRequired, UsedName } from '../exceptions'
import AddressService from './addresses'
import { Address as AddressInterface } from '../database/address/dao'
import Keychain from '../models/keys/keychain'
import { updateApplicationMenu } from '../utils/application-menu'
import AddressesUsedSubject from '../subjects/addresses-used-subject'

const { core } = NodeService.getInstance()
const fileService = FileService.getInstance()

const MODULE_NAME = 'wallets'
const DEBOUNCE_TIME = 50

export interface Wallet {
  id: string
  name: string

  loadKeystore: () => Keystore
  accountExtendedPublicKey: () => AccountExtendedPublicKey
}

export interface WalletProperties {
  id: string
  name: string
  extendedKey: string // Serialized account extended public key
  keystore?: Keystore
}

const broadcastCurrentAddresses = async (currentId: string) => {
  const addresses = await AddressService.allAddressesByWalletId(currentId).then(addrs =>
    addrs.map(({ address, blake160: identifier, addressType: type, txCount, description = '' }) => ({
      address,
      identifier,
      type,
      txCount,
      description,
    }))
  )
  windowManage.broadcast(Channel.Wallets, 'allAddresses', {
    status: ResponseCode.Success,
    result: addresses,
  })
}

export class FileKeystoreWallet implements Wallet {
  public id: string
  public name: string
  private extendedKey: string = ''

  constructor(props: WalletProperties) {
    const { id, name, extendedKey } = props

    if (id === undefined) throw new IsRequired('ID')
    if (name === undefined) throw new IsRequired('Name')

    this.id = id
    this.name = name
    this.extendedKey = extendedKey
  }

  accountExtendedPublicKey = (): AccountExtendedPublicKey => {
    return AccountExtendedPublicKey.parse(this.extendedKey) as AccountExtendedPublicKey
  }

  static fromJSON = (json: WalletProperties) => {
    return new FileKeystoreWallet(json)
  }

  public update = ({ name }: { name: string }) => {
    if (name) {
      this.name = name
    }
  }

  public toJSON = () => {
    return {
      id: this.id,
      name: this.name,
      extendedKey: this.extendedKey,
    }
  }

  public loadKeystore = () => {
    const data = fileService.readFileSync(MODULE_NAME, this.keystoreFileName())
    return Keystore.fromJson(data)
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

const onCurrentWalletUpdated = (wallets: WalletProperties[], currentId: string) => {
  const wallet = wallets.find(w => w.id === currentId)
  if (!wallet) return
  windowManage.broadcast(Channel.Wallets, 'getActive', {
    status: ResponseCode.Success,
    result: {
      id: wallet.id,
      name: wallet.name,
    },
  })
  updateApplicationMenu(wallets, currentId)
}

const onWalletsUpdated = (wallets: WalletProperties[], currentId: string | undefined) => {
  const result = wallets.map(({ id, name }) => ({ id, name }))
  windowManage.broadcast(Channel.Wallets, 'getAll', {
    status: ResponseCode.Success,
    result,
  })
  updateApplicationMenu(wallets, currentId)
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

    fromEvent<[any, WalletProperties[]]>(this.listStore, this.walletsKey)
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(([, wallets]) => {
        const wallet = this.getCurrent()
        if (wallet) {
          onCurrentWalletUpdated(wallets, wallet.id)
        }
        onWalletsUpdated(wallets, wallet && wallet.id)
      })

    fromEvent(this.listStore, this.currentWalletKey)
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(([, newId]) => {
        if (newId === undefined) return
        broadcastCurrentAddresses(newId)
        const wallets = this.getAll()
        onCurrentWalletUpdated(wallets, newId)
      })

    AddressesUsedSubject.getSubject().subscribe(async () => {
      const currentWallet = this.getCurrent()
      if (currentWallet) {
        broadcastCurrentAddresses(currentWallet.id)
      }
    })
  }

  public getAll = (): WalletProperties[] => {
    return this.listStore.readSync(this.walletsKey) || []
  }

  public get = (id: string): Wallet => {
    if (id === undefined) {
      throw new IsRequired('ID')
    }

    const wallet = this.getAll().find(w => w.id === id)
    if (!wallet) {
      throw new WalletNotFound(id)
    }

    return FileKeystoreWallet.fromJSON(wallet)
  }

  public generateAddressesById = async (
    id: string,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    const wallet: Wallet = this.get(id)
    const accountExtendedPublicKey: AccountExtendedPublicKey = wallet.accountExtendedPublicKey()
    await AddressService.generateAndSave(id, accountExtendedPublicKey, receivingAddressCount, changeAddressCount)
  }

  public generateCurrentWalletAddresses = async (
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    const wallet: Wallet | undefined = this.getCurrent()
    if (!wallet) {
      return undefined
    }
    return this.generateAddressesById(wallet.id, receivingAddressCount, changeAddressCount)
  }

  public create = (props: WalletProperties) => {
    if (!props) throw new IsRequired('wallet property')

    const index = this.getAll().findIndex(wallet => wallet.name === props.name)

    if (index !== -1) {
      throw new UsedName('Wallet')
    }

    const wallet = new FileKeystoreWallet({ ...props, id: uuid() })

    wallet.saveKeystore(props.keystore!)

    this.listStore.writeSync(this.walletsKey, [...this.getAll(), wallet.toJSON()])

    if (this.getAll().length === 1) {
      this.setCurrent(wallet.id)
    }
    return wallet
  }

  public update = (id: string, props: Omit<WalletProperties, 'id' | 'extendedKey'>) => {
    const wallets = this.getAll()
    const index = wallets.findIndex((w: WalletProperties) => w.id === id)
    if (index === -1) {
      throw new WalletNotFound(id)
    }

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
    if (!wallet) {
      throw new WalletNotFound(id)
    }

    return wallet.loadKeystore().checkPassword(password)
  }

  public clearAll = () => {
    this.getAll().forEach(w => {
      const wallet = FileKeystoreWallet.fromJSON(w)
      wallet.deleteKeystore()
    })
    this.listStore.clear()
  }

  public sendCapacity = async (
    items: {
      address: string
      capacity: string
    }[],
    password: string,
    fee: string = '0',
    description?: string
  ) => {
    const wallet = await this.getCurrent()
    if (!wallet) {
      throw new CurrentWalletNotSet()
    }

    if (password === undefined || password === '') {
      throw new IsRequired('Password')
    }

    const addressInfos = await this.getAddressInfos()

    const addresses: string[] = addressInfos.map(info => info.address)

    const lockHashes: string[] = await Promise.all(addresses.map(async addr => LockUtils.addressToLockHash(addr)))

    const targetOutputs = items.map(item => ({
      ...item,
      capacity: (BigInt(item.capacity) * BigInt(1)).toString(),
    }))

    const changeAddress: string = await this.getChangeAddress()

    const tx: TransactionWithoutHash = await TransactionsService.generateTx(
      lockHashes,
      targetOutputs,
      changeAddress,
      fee
    )

    const txHash: string = await (core.rpc as any).computeTransactionHash(ConvertTo.toSdkTxWithoutHash(tx))

    const { inputs } = tx

    const paths = addressInfos.map(info => info.path)
    const pathAndPrivateKeys = this.getPrivateKeys(wallet, paths, password)

    const witnesses: Witness[] = inputs!.map((input: Input) => {
      const blake160: string = input.lock!.args![0]
      const info = addressInfos.find(i => i.blake160 === blake160)
      const { path } = info!
      const pathAndPrivateKey = pathAndPrivateKeys.find(p => p.path === path)
      if (!pathAndPrivateKey) {
        throw new Error('no private key found')
      }
      const { privateKey } = pathAndPrivateKey
      const witness = this.signWitness({ data: [] }, privateKey, txHash)
      return witness
    })

    tx.witnesses = witnesses

    const txToSend = ConvertTo.toSdkTxWithoutHash(tx)
    await core.rpc.sendTransaction(txToSend)

    tx.description = description
    TransactionsService.txSentSubject.next({
      transaction: tx,
      txHash,
    })

    return txHash
  }

  // path is a BIP44 full path such as "m/44'/309'/0'/0/0"
  public getAddressInfos = async (): Promise<AddressInterface[]> => {
    const walletId = this.getCurrent()!.id
    const addrs = await AddressService.allAddressesByWalletId(walletId)
    return addrs
  }

  public getChangeAddress = async (): Promise<string> => {
    const walletId = this.getCurrent()!.id
    const addr = await AddressService.nextUnusedChangeAddress(walletId)
    return addr!.address
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

  // Derivate all child private keys for specified BIP44 paths.
  public getPrivateKeys = (wallet: Wallet, paths: string[], password: string): PathAndPrivateKey[] => {
    const masterPrivateKey = wallet.loadKeystore().extendedPrivateKey(password)
    const masterKeychain = new Keychain(
      Buffer.from(masterPrivateKey.privateKey, 'hex'),
      Buffer.from(masterPrivateKey.chainCode, 'hex')
    )

    const uniquePaths = paths.filter((value, idx, a) => a.indexOf(value) === idx)
    return uniquePaths.map(path => ({
      path,
      privateKey: `0x${masterKeychain.derivePath(path).privateKey.toString('hex')}`,
    }))
  }
}

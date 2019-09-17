import { v4 as uuid } from 'uuid'
import { debounceTime } from 'rxjs/operators'
import { AccountExtendedPublicKey, PathAndPrivateKey } from 'models/keys/key'
import Keystore from 'models/keys/keystore'
import Store from 'models/store'
import LockUtils from 'models/lock-utils'
import { Witness, TransactionWithoutHash, Input } from 'types/cell-types'
import ConvertTo from 'types/convert-to'
import Blake2b from 'utils/blake2b'
import { WalletNotFound, IsRequired, UsedName } from 'exceptions'
import { Address as AddressInterface } from 'database/address/dao'
import Keychain from 'models/keys/keychain'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import AddressesUsedSubject from 'models/subjects/addresses-used-subject'
import { WalletListSubject, CurrentWalletSubject } from 'models/subjects/wallets'
import dataUpdateSubject from 'models/subjects/data-update'
import CommandSubject from 'models/subjects/command'
import WindowManager from 'models/window-manager'
import CellsService from 'services/cells'
import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import env from 'env'

import NodeService from './node'
import FileService from './file'
import { TransactionsService, TransactionPersistor, TransactionGenerator } from './tx'
import AddressService from './addresses'
import { deindexLockHashes } from './indexer/deindex'

const { core } = NodeService.getInstance()
const fileService = FileService.getInstance()

const MODULE_NAME = 'wallets'
const DEBOUNCE_TIME = 200
const SECP_CYCLES = BigInt('1440000')

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

export class FileKeystoreWallet implements Wallet {
  public id: string
  public name: string
  private extendedKey: string = ''

  constructor(props: WalletProperties) {
    const { id, name, extendedKey } = props

    if (id === undefined) {
      throw new IsRequired('ID')
    }
    if (name === undefined) {
      throw new IsRequired('Name')
    }

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

    this.listStore.on(
      this.walletsKey,
      (prevWalletList: WalletProperties[] = [], currentWalletList: WalletProperties[] = []) => {
        const currentWallet = this.getCurrent()
        WalletListSubject.next({ currentWallet, prevWalletList, currentWalletList })
      }
    )
    this.listStore.on(this.currentWalletKey, (_prevId: string | undefined, currentID: string | undefined) => {
      if (undefined === currentID) {
        return
      }
      const currentWallet = this.getCurrent() || null
      const walletList = this.getAll()
      CurrentWalletSubject.next({
        currentWallet,
        walletList,
      })
    })

    AddressDbChangedSubject.getSubject()
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(() => {
        dataUpdateSubject.next({
          dataType: 'address',
          actionType: 'update',
        })
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
    isImporting: boolean,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    const wallet: Wallet = this.get(id)
    const accountExtendedPublicKey: AccountExtendedPublicKey = wallet.accountExtendedPublicKey()
    await AddressService.checkAndGenerateSave(
      id,
      accountExtendedPublicKey,
      isImporting,
      receivingAddressCount,
      changeAddressCount
    )
  }

  public generateCurrentWalletAddresses = async (
    isImporting: boolean,
    receivingAddressCount: number = 20,
    changeAddressCount: number = 10
  ) => {
    const wallet: Wallet | undefined = this.getCurrent()
    if (!wallet) {
      return undefined
    }
    return this.generateAddressesById(wallet.id, isImporting, receivingAddressCount, changeAddressCount)
  }

  public create = (props: WalletProperties) => {
    if (!props) {
      throw new IsRequired('wallet property')
    }

    const index = this.getAll().findIndex(wallet => wallet.name === props.name)

    if (index !== -1) {
      throw new UsedName('Wallet')
    }

    const wallet = new FileKeystoreWallet({ ...props, id: uuid() })

    wallet.saveKeystore(props.keystore!)

    this.listStore.writeSync(this.walletsKey, [...this.getAll(), wallet.toJSON()])

    this.setCurrent(wallet.id)
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

  public delete = async (id: string) => {
    const wallets = this.getAll()
    const walletJSON = wallets.find(w => w.id === id)

    if (!walletJSON) {
      throw new WalletNotFound(id)
    }

    const wallet = FileKeystoreWallet.fromJSON(walletJSON)
    const newWallets = wallets.filter(w => w.id !== id)

    const current = this.getCurrent()
    const currentID = current ? current.id : ''

    if (currentID === id) {
      if (newWallets.length > 0) {
        this.setCurrent(newWallets[0].id)
      } else {
        this.setCurrent('')
      }
    }

    this.listStore.writeSync(this.walletsKey, newWallets)
    wallet.deleteKeystore()
    const addressInterfaces = await AddressService.deleteByWalletId(id)
    this.deindexAddresses(addressInterfaces.map(addr => addr.address))
  }

  private deindexAddresses = async (addresses: string[]) => {
    const prefix = env.testnet ? AddressPrefix.Testnet : AddressPrefix.Mainnet
    const addressesWithEnvPrefix: string[] = addresses.filter(addr => addr.startsWith(prefix))

    if (addressesWithEnvPrefix.length === 0) {
      return
    }
    const addrs: string[] = (await AddressService.findByAddresses(addressesWithEnvPrefix)).map(addr => addr.address)
    const deindexAddresses: string[] = addresses.filter(item => addrs.indexOf(item) < 0);
    // only deindex if no same wallet
    if (deindexAddresses.length !== 0) {
      const lockHashes: string[] = await Promise.all(
        deindexAddresses.map(async address => {
          return LockUtils.addressToLockHash(address)
        })
      )
      // don't await
      deindexLockHashes(lockHashes)
    }
  }

  public setCurrent = (id: string) => {
    if (id === undefined) {
      throw new IsRequired('ID')
    }

    if (id !== '') {
      const wallet = this.get(id)
      if (!wallet) {
        throw new WalletNotFound(id)
      }
    }

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
    walletID: string = '',
    items: {
      address: string
      capacity: string
    }[] = [],
    password: string = '',
    fee: string = '0',
    description: string = ''
  ) => {
    const wallet = await this.get(walletID)
    if (!wallet) {
      throw new WalletNotFound(walletID)
    }

    if (password === '') {
      throw new IsRequired('Password')
    }

    const addressInfos = await this.getAddressInfos(walletID)

    const addresses: string[] = addressInfos.map(info => info.address)

    const lockHashes: string[] = await LockUtils.addressesToAllLockHashes(addresses)

    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString(),
    }))

    const changeAddress: string = await this.getChangeAddress()

    const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
      lockHashes,
      targetOutputs,
      changeAddress,
      fee
    )

    let txHash: string = core.utils.rawTransactionToHash(ConvertTo.toSdkTxWithoutHash(tx))
    if (!txHash.startsWith('0x')) {
      txHash = `0x${txHash}`
    }

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
    await TransactionPersistor.saveSentTx(tx, txHash)

    // update addresses txCount and balance
    const blake160s = TransactionsService.blake160sOfTx(tx)
    const usedAddresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160))
    AddressesUsedSubject.getSubject().next(usedAddresses)

    return txHash
  }

  public computeCycles = async (walletID: string = '', capacities: string): Promise<string> => {
    const wallet = await this.get(walletID)
    if (!wallet) {
      throw new WalletNotFound(walletID)
    }

    const addressInfos = await this.getAddressInfos(walletID)

    const addresses: string[] = addressInfos.map(info => info.address)

    const lockHashes: string[] = await LockUtils.addressesToAllLockHashes(addresses)

    const { inputs } = await CellsService.gatherInputs(capacities, lockHashes, '0')
    const cycles = SECP_CYCLES * BigInt(inputs.length)

    return cycles.toString()
  }

  // path is a BIP44 full path such as "m/44'/309'/0'/0/0"
  public getAddressInfos = async (walletID: string): Promise<AddressInterface[]> => {
    const wallet = await this.get(walletID)
    if (!wallet) {
      throw new WalletNotFound(walletID)
    }
    const addrs = await AddressService.allAddressesByWalletId(walletID)
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
    const signature = `0x${addrObj.signRecoverable(message)}`
    const newWitness: Witness = {
      data: [signature],
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

  public requestPassword = (walletID: string, actionType: 'delete-wallet' | 'backup-wallet') => {
    if (WindowManager.mainWindow) {
      CommandSubject.next({
        winID: WindowManager.mainWindow.id,
        type: actionType,
        payload: walletID,
      })
    }
  }
}

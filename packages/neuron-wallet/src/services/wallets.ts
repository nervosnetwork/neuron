import { v4 as uuid } from 'uuid'
import { WalletNotFound, IsRequired, UsedName, WalletFunctionNotSupported, DuplicateImportWallet } from '../exceptions'
import Store from '../models/store'
import { hd } from '@ckb-lumos/lumos'
import WalletDeletedSubject from '../models/subjects/wallet-deleted-subject'
import { WalletListSubject, CurrentWalletSubject } from '../models/subjects/wallets'
import { DefaultAddressNumber } from '../utils/scriptAndAddress'
import { Address as AddressInterface } from '../models/address'

import FileService from './file'
import AddressService from './addresses'
import { DeviceInfo } from './hardware/common'
import HdPublicKeyInfo from '../database/chain/entities/hd-public-key-info'
import { In, Not } from 'typeorm'
import { getConnection } from '../database/chain/connection'
import NetworksService from './networks'
import { NetworkType } from '../models/network'
import { resetSyncTaskQueue } from '../block-sync-renderer'
import SyncProgressService from './sync-progress'
import { prefixWith0x } from '../utils/scriptAndAddress'

const fileService = FileService.getInstance()

const MODULE_NAME = 'wallets'

export interface WalletProperties {
  id: string
  name: string
  extendedKey: string // Serialized account extended public key
  isHDWallet?: boolean
  device?: DeviceInfo
  keystore?: hd.Keystore
  startBlockNumber?: string
}

export abstract class Wallet {
  public id: string
  public name: string
  public device?: DeviceInfo
  protected extendedKey: string = ''
  protected isHD: boolean
  protected startBlockNumber?: string

  constructor(props: WalletProperties) {
    const { id, name, extendedKey, device, isHDWallet, startBlockNumber } = props

    if (id === undefined) {
      throw new IsRequired('ID')
    }
    if (name === undefined) {
      throw new IsRequired('Name')
    }

    if (!extendedKey && !device) {
      throw new IsRequired('Extended Public Key or Device Info')
    }

    this.id = id
    this.name = name
    this.extendedKey = prefixWith0x(extendedKey)
    this.device = device
    this.isHD = isHDWallet ?? true
    this.startBlockNumber = startBlockNumber
  }

  public toJSON = () => ({
    id: this.id,
    name: this.name,
    extendedKey: this.extendedKey,
    device: this.device,
    isHD: this.isHD,
    startBlockNumber: this.startBlockNumber,
  })

  public fromJSON = () => {
    throw new Error('not implemented')
  }

  public loadKeystore = (): hd.Keystore => {
    throw new WalletFunctionNotSupported(this.loadKeystore.name)
  }

  public saveKeystore = (_keystore: hd.Keystore): void => {
    throw new WalletFunctionNotSupported(this.saveKeystore.name)
  }

  public deleteKeystore = (): void => {
    throw new WalletFunctionNotSupported(this.deleteKeystore.name)
  }

  public getDeviceInfo = (): DeviceInfo => {
    throw new WalletFunctionNotSupported(this.getDeviceInfo.name)
  }

  public accountExtendedPublicKey = (): hd.AccountExtendedPublicKey => {
    throw new WalletFunctionNotSupported(this.accountExtendedPublicKey.name)
  }

  public update = ({
    name,
    device,
    startBlockNumber,
  }: Pick<Partial<WalletProperties>, 'name' | 'device' | 'startBlockNumber'>) => {
    if (name) {
      this.name = name
    }
    if (device) {
      this.device = device
    }
    if (startBlockNumber) {
      this.startBlockNumber = startBlockNumber
    }
  }

  public async needsGenerateAddress() {
    return false
  }

  public abstract checkAndGenerateAddresses(
    isImporting?: boolean,
    receivingAddressCount?: number,
    changeAddressCount?: number
  ): Promise<AddressInterface[] | undefined>

  public abstract getNextAddress(): Promise<AddressInterface | undefined>

  public abstract getNextChangeAddress(): Promise<AddressInterface | undefined>

  public abstract getNextReceivingAddresses(): Promise<AddressInterface[]>

  public abstract getAllAddresses(): Promise<AddressInterface[]>

  public abstract isHDWallet(): boolean

  public abstract isHardware(): boolean
}

export class FileKeystoreWallet extends Wallet {
  public isHardware = (): boolean => {
    return false
  }

  public isHDWallet() {
    return true
  }

  constructor(props: WalletProperties) {
    super(props)
    this.isHD = true
  }

  accountExtendedPublicKey = (): hd.AccountExtendedPublicKey => {
    return hd.AccountExtendedPublicKey.parse(this.extendedKey)
  }

  public toJSON = () => {
    return {
      id: this.id,
      name: this.name,
      extendedKey: this.extendedKey,
      device: this.device,
      isHD: this.isHD,
      startBlockNumber: this.startBlockNumber,
    }
  }

  public loadKeystore = () => {
    const data = fileService.readFileSync(MODULE_NAME, this.keystoreFileName())
    return hd.Keystore.fromJson(data)
  }

  static fromJSON = (json: WalletProperties) => {
    return new FileKeystoreWallet(json)
  }

  public saveKeystore = (keystore: hd.Keystore): void => {
    fileService.writeFileSync(MODULE_NAME, this.keystoreFileName(), JSON.stringify({ ...keystore, id: this.id }))
  }

  deleteKeystore = () => {
    fileService.deleteFileSync(MODULE_NAME, this.keystoreFileName())
  }

  keystoreFileName = () => {
    return `${this.id}.json`
  }

  public async needsGenerateAddress() {
    const [receiveCount, changeCount] = await AddressService.getAddressCountsToFillGapLimit(this.id)
    return receiveCount !== 0 || changeCount !== 0
  }

  public checkAndGenerateAddresses = async (
    isImporting: boolean = false,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change
  ): Promise<AddressInterface[] | undefined> => {
    return await AddressService.generateAndSaveForExtendedKeyQueue.asyncPush({
      walletId: this.id,
      extendedKey: this.accountExtendedPublicKey(),
      isImporting,
      receivingAddressCount,
      changeAddressCount,
    })
  }

  public getNextAddress = async (): Promise<AddressInterface | undefined> => {
    return AddressService.getNextUnusedAddressByWalletId(this.id)
  }

  public getNextChangeAddress = async (): Promise<AddressInterface | undefined> => {
    return AddressService.getNextUnusedChangeAddressByWalletId(this.id)
  }

  public getNextReceivingAddresses = async (): Promise<AddressInterface[]> => {
    return AddressService.getUnusedReceivingAddressesByWalletId(this.id)
  }

  public getAllAddresses = async (): Promise<AddressInterface[]> => {
    return AddressService.getAddressesByWalletId(this.id)
  }
}

export class HardwareWallet extends Wallet {
  public isHardware = (): boolean => {
    return true
  }

  public isHDWallet() {
    return this.isHD
  }

  constructor(props: WalletProperties) {
    super(props)
    this.isHD = false
  }

  accountExtendedPublicKey = (): hd.AccountExtendedPublicKey => {
    return hd.AccountExtendedPublicKey.parse(this.extendedKey)
  }

  static fromJSON = (json: WalletProperties) => {
    return new HardwareWallet(json)
  }

  public getDeviceInfo = (): DeviceInfo => {
    return this.device!
  }

  public checkAndGenerateAddresses = async (): Promise<AddressInterface[] | undefined> => {
    const { addressType, addressIndex } = this.getDeviceInfo()
    const { publicKey } = hd.AccountExtendedPublicKey.parse(this.extendedKey)
    const address = await AddressService.generateAndSaveForPublicKeyQueue.asyncPush({
      walletId: this.id,
      publicKey,
      addressType,
      addressIndex,
    })

    if (address) {
      return [address]
    }
  }

  public getNextAddress = async (): Promise<AddressInterface | undefined> => {
    return AddressService.getFirstAddressByWalletId(this.id)
  }

  public getNextChangeAddress = async (): Promise<AddressInterface | undefined> => {
    return AddressService.getFirstAddressByWalletId(this.id)
  }

  public getNextReceivingAddresses = async (): Promise<AddressInterface[]> => {
    const address = await AddressService.getFirstAddressByWalletId(this.id)
    if (address) {
      return [address]
    }

    return []
  }

  public getAllAddresses = async (): Promise<AddressInterface[]> => {
    return AddressService.getAddressesByWalletId(this.id)
  }
}

export default class WalletService {
  private static instance: WalletService
  private listStore: Store // Save wallets (meta info except keystore, which is persisted separately)
  private walletsKey = 'wallets'
  private currentWalletKey = 'current'
  private importedWallet: Wallet | undefined

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
      (previousWalletList: WalletProperties[] = [], currentWalletList: WalletProperties[] = []) => {
        if (process.type === 'browser') {
          const currentWallet = this.getCurrent()
          WalletListSubject.next({ currentWallet, previousWalletList, currentWalletList })
        }
      }
    )
    this.listStore.on(this.currentWalletKey, (_prevId: string | undefined, currentID: string | undefined) => {
      if (undefined === currentID) {
        return
      }
      if (process.type === 'browser') {
        const currentWallet = this.getCurrent() || null
        const walletList = this.getAll()
        CurrentWalletSubject.next({
          currentWallet,
          walletList,
        })
      }
    })
  }

  private fromJSON(json: WalletProperties) {
    if (json.device) {
      return HardwareWallet.fromJSON(json)
    }
    return FileKeystoreWallet.fromJSON(json)
  }

  private async cleanupAddresses() {
    const allWallets = this.getAll()
    await getConnection()
      .getRepository(HdPublicKeyInfo)
      .delete({
        walletId: Not(In(allWallets.map(w => w.id))),
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

    return this.fromJSON(wallet)
  }

  public maintainAddressesIfNecessary = async () => {
    for (const { id } of this.getAll()) {
      const wallet = this.get(id)
      if ((await AddressService.getAddressesByWalletId(wallet.id)).length === 0) {
        await wallet.checkAndGenerateAddresses()
      }
    }

    await this.cleanupAddresses()
  }

  public async checkAndGenerateAddress(walletIds: string[]) {
    for (const walletId of new Set(walletIds)) {
      const wallet = this.get(walletId)
      await wallet.checkAndGenerateAddresses()
    }
  }

  public async checkNeedGenerateAddress(walletIds: string[]) {
    for (const walletId of new Set(walletIds)) {
      const wallet = this.get(walletId)
      if (await wallet.needsGenerateAddress()) {
        return true
      }
    }
    return false
  }

  public create = (props: WalletProperties) => {
    if (!props) {
      throw new IsRequired('wallet property')
    }
    props = { ...props, extendedKey: prefixWith0x(props.extendedKey) }
    const index = this.getAll().findIndex(wallet => wallet.name === props.name)

    if (index !== -1) {
      throw new UsedName('Wallet')
    }

    const id = uuid()

    const wallet = this.fromJSON({ ...props, id })

    if (!wallet.isHardware()) {
      wallet.saveKeystore(props.keystore!)
    }

    const existWalletInfo = this.getAll().find(item => item.extendedKey === props.extendedKey)
    if (existWalletInfo) {
      const existWallet = FileKeystoreWallet.fromJSON(existWalletInfo)
      const existWalletIsWatchOnly = existWallet.isHDWallet() && existWallet.loadKeystore().isEmpty()
      this.importedWallet = wallet
      throw new DuplicateImportWallet(
        JSON.stringify({
          extendedKey: props.extendedKey,
          existWalletIsWatchOnly,
          existingWalletId: existWallet.id,
          id,
        })
      )
    }

    this.listStore.writeSync(this.walletsKey, [...this.getAll(), wallet.toJSON()])

    this.setCurrent(wallet.id)
    return wallet
  }

  public replace = async (existingWalletId: string, importedWalletId: string) => {
    const wallet = this.get(existingWalletId)
    if (!wallet || !this.importedWallet) {
      throw new WalletNotFound(existingWalletId)
    }

    const newWallet = this.importedWallet?.toJSON()
    if (importedWalletId !== newWallet.id) {
      throw new WalletNotFound(importedWalletId)
    }
    if (wallet.toJSON().extendedKey !== newWallet.extendedKey) {
      throw new Error('The wallets are not the same and cannot be replaced.')
    }

    const wallets = this.getAll()

    this.listStore.writeSync(this.walletsKey, [...wallets, newWallet])

    this.setCurrent(newWallet.id)

    await AddressService.deleteByWalletId(existingWalletId)
    await SyncProgressService.deleteWalletSyncProgress(existingWalletId)

    const newWallets = wallets.filter(w => w.id !== existingWalletId)
    this.listStore.writeSync(this.walletsKey, [...newWallets, newWallet])

    if (!wallet.isHardware()) {
      wallet.deleteKeystore()
    }
  }

  public update = (id: string, props: Omit<WalletProperties, 'id' | 'extendedKey'>) => {
    const wallets = this.getAll()
    const index = wallets.findIndex((w: WalletProperties) => w.id === id)
    if (index === -1) {
      throw new WalletNotFound(id)
    }

    const wallet = this.fromJSON(wallets[index])

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

    const wallet = this.fromJSON(walletJSON)
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

    await AddressService.deleteByWalletId(id)
    await SyncProgressService.deleteWalletSyncProgress(id)

    this.listStore.writeSync(this.walletsKey, newWallets)

    if (!wallet.isHardware()) {
      wallet.deleteKeystore()
    }

    if (process.send) {
      process.send({ channel: 'wallet-deleted', message: id })
    } else {
      WalletDeletedSubject.getSubject().next(id)
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

    const network = NetworksService.getInstance().getCurrent()
    if (network.type === NetworkType.Light) {
      resetSyncTaskQueue.asyncPush(true)
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
      const wallet = this.fromJSON(w)
      if (!wallet.isHardware()) {
        wallet.deleteKeystore()
      }
    })
    this.listStore.clear()
  }
}

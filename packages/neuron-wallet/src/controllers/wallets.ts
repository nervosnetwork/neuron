import fs from 'fs'
import { t } from 'i18next'
import { dialog, SaveDialogReturnValue, BrowserWindow, OpenDialogReturnValue } from 'electron'
import WalletsService, { Wallet, WalletProperties, FileKeystoreWallet } from '../services/wallets'
import NetworksService from '../services/networks'
import Keystore from '../models/keys/keystore'
import Keychain from '../models/keys/keychain'
import { validateMnemonic, mnemonicToSeedSync } from '../models/keys/mnemonic'
import { AccountExtendedPublicKey, ExtendedPrivateKey, generateMnemonic } from '../models/keys/key'
import CommandSubject from '../models/subjects/command'
import { ResponseCode } from '../utils/const'
import {
  CurrentWalletNotSet,
  IsRequired,
  WalletNotFound,
  InvalidMnemonic,
  ServiceHasNoResponse,
  EmptyPassword,
  IncorrectPassword,
  InvalidJSON,
  InvalidAddress,
  UsedName,
  MainnetAddressRequired,
  TestnetAddressRequired,
} from '../exceptions'
import AddressService from '../services/addresses'
import TransactionSender from '../services/transaction-sender'
import Transaction from '../models/chain/transaction'
import logger from '../utils/logger'
import { set as setDescription } from '../services/tx/transaction-description'
import HardwareWalletService from '../services/hardware'
import { DeviceInfo, ExtendedPublicKey } from '../services/hardware/common'
import AddressParser from '../models/address-parser'
import MultisigConfigModel from '../models/multisig-config'
import NodeService from '../services/node'
import { generateRPC } from '../utils/ckb-rpc'

export default class WalletsController {
  public async getAll(): Promise<Controller.Response<Pick<Wallet, 'id' | 'name' | 'device'>[]>> {
    const wallets = WalletsService.getInstance().getAll()
    if (!wallets) {
      throw new ServiceHasNoResponse('Wallet')
    }
    return {
      status: ResponseCode.Success,
      result: wallets.map(({ name, id, device }) => ({ name, id, device })),
    }
  }

  public async get(id: string): Promise<Controller.Response<Wallet>> {
    if (typeof id === 'undefined') {
      throw new IsRequired('ID')
    }

    const wallet = WalletsService.getInstance().get(id)
    if (!wallet) {
      throw new WalletNotFound(id)
    }
    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  public async importMnemonic({
    name,
    password,
    mnemonic,
  }: {
    name: string
    password: string
    mnemonic: string
  }): Promise<Controller.Response<Omit<WalletProperties, 'extendedKey'>>> {
    return await this.createByMnemonic({ name, password, mnemonic, isImporting: true })
  }

  public async create({
    name,
    password,
    mnemonic,
  }: {
    name: string
    password: string
    mnemonic: string
  }): Promise<Controller.Response<Omit<WalletProperties, 'extendedKey'>>> {
    return await this.createByMnemonic({ name, password, mnemonic, isImporting: false })
  }

  private async createByMnemonic({
    name,
    password,
    mnemonic,
    isImporting,
  }: {
    name: string
    password: string
    mnemonic: string
    isImporting: boolean
  }): Promise<Controller.Response<Omit<WalletProperties, 'extendedKey'>>> {
    if (!validateMnemonic(mnemonic)) {
      throw new InvalidMnemonic()
    }

    const seed = mnemonicToSeedSync(mnemonic)
    const masterKeychain = Keychain.fromSeed(seed)
    if (!masterKeychain.privateKey) {
      throw new InvalidMnemonic()
    }
    const extendedKey = new ExtendedPrivateKey(
      masterKeychain.privateKey.toString('hex'),
      masterKeychain.chainCode.toString('hex')
    )
    const keystore = Keystore.create(extendedKey, password)

    const accountKeychain = masterKeychain.derivePath(AccountExtendedPublicKey.ckbAccountPath)
    const accountExtendedPublicKey = new AccountExtendedPublicKey(
      accountKeychain.publicKey.toString('hex'),
      accountKeychain.chainCode.toString('hex')
    )

    const walletsService = WalletsService.getInstance()
    const rpc = generateRPC(NodeService.getInstance().nodeUrl)
    let startBlockNumberInLight: string | undefined = undefined
    if (!isImporting) {
      try {
        startBlockNumberInLight = await rpc.getTipBlockNumber()
      } catch (error) {
        startBlockNumberInLight = undefined
      }
    }
    const wallet = walletsService.create({
      id: '',
      name,
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore,
      startBlockNumberInLight,
    })

    wallet.checkAndGenerateAddresses(isImporting)

    return {
      status: ResponseCode.Success,
      result: {
        id: wallet.id,
        name: wallet.name,
      },
    }
  }

  public async importKeystore({
    name,
    password,
    keystorePath,
  }: {
    name: string
    password: string
    keystorePath: string
  }): Promise<Controller.Response<Wallet>> {
    if (password === undefined) {
      throw new IsRequired('Password')
    }
    const keystore = fs.readFileSync(keystorePath, 'utf8')
    try {
      JSON.parse(keystore)
    } catch {
      throw new InvalidJSON()
    }
    const keystoreObject = Keystore.fromJson(keystore)
    const masterPrivateKey = keystoreObject.extendedPrivateKey(password)
    const masterKeychain = new Keychain(
      Buffer.from(masterPrivateKey.privateKey, 'hex'),
      Buffer.from(masterPrivateKey.chainCode, 'hex')
    )
    const accountKeychain = masterKeychain.derivePath(AccountExtendedPublicKey.ckbAccountPath)
    const accountExtendedPublicKey = new AccountExtendedPublicKey(
      accountKeychain.publicKey.toString('hex'),
      accountKeychain.chainCode.toString('hex')
    )

    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.create({
      id: '',
      name,
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore: keystoreObject,
    })

    wallet.checkAndGenerateAddresses(true)

    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  public async update({
    id,
    name,
    password,
    newPassword,
    device,
  }: {
    id: string
    password: string
    name: string
    newPassword?: string
    device?: DeviceInfo
  }): Promise<Controller.Response<Wallet>> {
    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.get(id)
    if (!wallet) {
      throw new WalletNotFound(id)
    }

    const props: { name: string; keystore?: Keystore; device?: DeviceInfo } = {
      name: name || wallet.name,
    }

    if (!wallet.isHardware()) {
      props.keystore = wallet.loadKeystore()
    }

    if (device && wallet.isHardware()) {
      props.device = device
    }

    if (newPassword) {
      const extendedPrivateKey = wallet!.loadKeystore().extendedPrivateKey(password)
      props.keystore = Keystore.create(extendedPrivateKey, newPassword)
    }

    walletsService.update(id, props)
    return {
      status: ResponseCode.Success,
      result: walletsService.get(id),
    }
  }

  public async delete({ id = '', password = '' }: Controller.Params.DeleteWallet): Promise<Controller.Response<any>> {
    if (password === '') {
      throw new EmptyPassword()
    }
    const walletsService = WalletsService.getInstance()
    if (!walletsService.validate({ id, password })) {
      throw new IncorrectPassword()
    }

    return this.deleteWallet(id)
  }

  public async backup({
    id = '',
    password = '',
  }: Controller.Params.BackupWallet): Promise<Controller.Response<boolean>> {
    const walletsService = WalletsService.getInstance()

    if (!walletsService.validate({ id, password })) {
      throw new IncorrectPassword()
    }

    return this.backupWallet(id)
  }

  public async importHardwareWallet({
    publicKey,
    chainCode,
    walletName,
  }: ExtendedPublicKey & { walletName: string }): Promise<Controller.Response<Wallet>> {
    const device = HardwareWalletService.getInstance().getCurrent()!
    const accountExtendedPublicKey = new AccountExtendedPublicKey(publicKey, chainCode)
    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.create({
      device: device.deviceInfo,
      id: '',
      name: walletName,
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore: Keystore.createEmpty(),
    })

    wallet.checkAndGenerateAddresses(true)

    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  public async importXPubkey(): Promise<Controller.Response<Wallet>> {
    return dialog
      .showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        title: t('messages.import-extended-public-key'),
        filters: [{ name: 'JSON File', extensions: ['json'] }],
      })
      .then((value: OpenDialogReturnValue) => {
        const filePath = value.filePaths[0]
        if (filePath) {
          try {
            const name = filePath.split(/[\\/]/).pop()!.split('.')[0] + '-Watch Only' // File name (without extension)
            const content = fs.readFileSync(filePath, 'utf8')
            const json: { xpubkey: string } = JSON.parse(content)
            const accountExtendedPublicKey = AccountExtendedPublicKey.parse(json.xpubkey)

            const walletsService = WalletsService.getInstance()
            const wallet = walletsService.create({
              id: '',
              name,
              extendedKey: accountExtendedPublicKey.serialize(),
              keystore: Keystore.createEmpty(),
            })

            wallet.checkAndGenerateAddresses(true)
            return {
              status: ResponseCode.Success,
              result: wallet,
            }
          } catch (e) {
            if (e instanceof UsedName) {
              throw e
            }
            throw new InvalidJSON()
          }
        }

        return { status: ResponseCode.Fail }
      })
  }

  public async exportXPubkey(id: string = ''): Promise<Controller.Response<boolean>> {
    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.get(id)
    const xpubkey = wallet.accountExtendedPublicKey()

    return dialog
      .showSaveDialog(BrowserWindow.getFocusedWindow()!, {
        title: t('messages.save-extended-public-key'),
        defaultPath: wallet.name + '-xpubkey.json',
      })
      .then((returnValue: SaveDialogReturnValue) => {
        if (returnValue.filePath) {
          fs.writeFileSync(returnValue.filePath, JSON.stringify({ xpubkey: xpubkey.serialize() }))
          return {
            status: ResponseCode.Success,
            result: true,
          }
        } else {
          return {
            status: ResponseCode.Fail,
            result: false,
          }
        }
      })
  }

  public getCurrent() {
    const currentWallet = WalletsService.getInstance().getCurrent() || null
    return {
      status: ResponseCode.Success,
      result: currentWallet
        ? {
            ...currentWallet.toJSON(),
            isWatchOnly: currentWallet.isHDWallet() && currentWallet.loadKeystore().isEmpty(),
          }
        : null,
    }
  }

  public async activate(id: string) {
    const walletsService = WalletsService.getInstance()
    walletsService.setCurrent(id)
    const currentWallet = walletsService.getCurrent() as FileKeystoreWallet
    if (!currentWallet || id !== currentWallet.id) {
      throw new CurrentWalletNotSet()
    }
    return {
      status: ResponseCode.Success,
      result: currentWallet.toJSON(),
    }
  }

  public async getAllAddresses(id: string) {
    const addresses = (await AddressService.getAddressesWithBalancesByWalletId(id)).map(
      ({
        address,
        blake160: identifier,
        addressType: type,
        txCount,
        balance,
        description = '',
        addressIndex: index = '',
      }) => ({
        address,
        identifier,
        type,
        txCount: txCount!,
        description,
        balance: balance!,
        index,
      })
    )
    return {
      status: ResponseCode.Success,
      result: addresses,
    }
  }

  public async sendTx(
    params: {
      walletID: string
      tx: Transaction
      password: string
      description?: string
      multisigConfig?: MultisigConfigModel
    },
    skipSign = false
  ) {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    let hash: string
    if (params.multisigConfig) {
      hash = await new TransactionSender().sendMultisigTx(
        params.walletID,
        Transaction.fromObject(params.tx),
        params.password,
        [params.multisigConfig],
        skipSign
      )
    } else {
      hash = await new TransactionSender().sendTx(
        params.walletID,
        Transaction.fromObject(params.tx),
        params.password,
        false,
        skipSign
      )
    }
    const description = params.description || params.tx.description || ''
    if (description !== '') {
      await setDescription(params.walletID, hash, description)
    }

    return {
      status: ResponseCode.Success,
      result: hash,
    }
  }

  public async generateTx(params: {
    walletID: string
    items: { address: string; capacity: string; date?: string }[]
    fee: string
    feeRate: string
  }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const addresses: string[] = params.items.map(i => i.address)
    this.checkAddresses(addresses)

    const tx: Transaction = await new TransactionSender().generateTx(
      params.walletID,
      params.items,
      params.fee,
      params.feeRate
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async generateSendingAllTx(params: {
    walletID: string
    items: { address: string; capacity: string; date?: string }[]
    fee: string
    feeRate: string
  }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const addresses: string[] = params.items.map(i => i.address)
    this.checkAddresses(addresses)

    const tx: Transaction = await new TransactionSender().generateSendingAllTx(
      params.walletID,
      params.items,
      params.fee,
      params.feeRate
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async generateMultisigTx(params: {
    items: { address: string; capacity: string }[]
    multisigConfig: MultisigConfigModel
  }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const addresses: string[] = params.items.map(i => i.address)
    this.checkAddresses(addresses)

    const tx: Transaction = await new TransactionSender().generateMultisigTx(params.items, params.multisigConfig)
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async generateMultisigSendAllTx(params: {
    items: { address: string; capacity: string }[]
    multisigConfig: MultisigConfigModel
  }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const addresses: string[] = params.items.map(i => i.address)
    this.checkAddresses(addresses)

    const tx: Transaction = await new TransactionSender().generateMultisigSendAllTx(params.items, params.multisigConfig)
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async updateAddressDescription({
    walletID,
    address,
    description,
  }: {
    walletID: string
    address: string
    description: string
  }) {
    const wallet = WalletsService.getInstance().get(walletID)
    await AddressService.updateDescription(wallet.id, address, description)

    return {
      status: ResponseCode.Success,
      result: {
        walletID,
        address,
        description,
      },
    }
  }

  // It would bypass verifying password window/event if wallet is watch only.
  public async requestPassword(walletID: string, action: 'delete-wallet' | 'backup-wallet') {
    const wallet = WalletsService.getInstance().get(walletID)
    if (wallet.isHardware()) {
      if (action === 'delete-wallet') {
        return this.deleteWallet(walletID)
      }
      return this.backupWallet(walletID)
    }

    const keystore = wallet.loadKeystore()
    if (keystore.isEmpty()) {
      // Watch only wallet imported with xpubkey
      if (action === 'delete-wallet') {
        return this.deleteWallet(walletID)
      } else {
        return this.backupWallet(walletID)
      }
    } else {
      const window = BrowserWindow.getFocusedWindow()
      if (window) {
        CommandSubject.next({
          winID: window.id,
          type: action,
          payload: walletID,
          dispatchToUI: true,
        })
      }
    }
  }

  public validateMnemonic(mnemonic: string) {
    return {
      status: ResponseCode.Success,
      result: validateMnemonic(mnemonic),
    }
  }

  public generateMnemonic() {
    return {
      status: ResponseCode.Success,
      result: generateMnemonic(),
    }
  }

  private checkAddresses = (addresses: string[]) => {
    const isMainnet = NetworksService.getInstance().isMainnet()
    addresses.forEach(address => {
      if (isMainnet && !address.startsWith('ckb')) {
        throw new MainnetAddressRequired(address)
      }

      if (!isMainnet && !address.startsWith('ckt')) {
        throw new TestnetAddressRequired(address)
      }

      if (!this.verifyAddress(address)) {
        throw new InvalidAddress(address)
      }
    })
  }

  private verifyAddress = (address: string): boolean => {
    try {
      AddressParser.parse(address)
      return true
    } catch (err) {
      logger.warn(`verify address error: ${err}`)
      return false
    }
  }

  // Important: Check password before calling this, unless it's deleting a watch only wallet.
  private async deleteWallet(id: string): Promise<Controller.Response<any>> {
    const walletsService = WalletsService.getInstance()
    await walletsService.delete(id)

    return {
      status: ResponseCode.Success,
    }
  }

  // Important: Check password before calling this, unless it's backing up a watch only wallet.
  private async backupWallet(id: string): Promise<Controller.Response<boolean>> {
    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.get(id)

    const keystore = wallet.loadKeystore()
    return dialog
      .showSaveDialog(BrowserWindow.getFocusedWindow()!, {
        title: t('messages.save-keystore'),
        defaultPath: wallet.name + '.json',
      })
      .then((returnValue: SaveDialogReturnValue) => {
        if (returnValue.canceled) {
          return {
            status: ResponseCode.Success,
            result: true,
          }
        } else if (returnValue.filePath) {
          fs.writeFileSync(returnValue.filePath, JSON.stringify(keystore))
          return {
            status: ResponseCode.Success,
            result: true,
          }
        } else {
          return {
            status: ResponseCode.Fail,
            result: false,
          }
        }
      })
  }
}

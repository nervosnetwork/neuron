import fs from 'fs'
import { parseAddress } from '@nervosnetwork/ckb-sdk-utils'
import { dialog, SaveDialogReturnValue, BrowserWindow } from 'electron'
import WalletsService, { Wallet, WalletProperties, FileKeystoreWallet } from 'services/wallets'
import NetworksService from 'services/networks'
import Keystore from 'models/keys/keystore'
import Keychain from 'models/keys/keychain'
import { validateMnemonic, mnemonicToSeedSync } from 'models/keys/mnemonic'
import { AccountExtendedPublicKey, ExtendedPrivateKey } from 'models/keys/key'
import { ResponseCode } from 'utils/const'
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
} from 'exceptions'
import i18n from 'utils/i18n'
import AddressService from 'services/addresses'
import WalletCreatedSubject from 'models/subjects/wallet-created-subject'
import { TransactionWithoutHash, OutPoint } from 'types/cell-types'
import { MainnetAddressRequired, TestnetAddressRequired } from 'exceptions/address'

export default class WalletsController {
  public static async getAll(): Promise<Controller.Response<Pick<Wallet, 'id' | 'name'>[]>> {
    const walletsService = WalletsService.getInstance()
    const wallets = walletsService.getAll()
    if (!wallets) {
      throw new ServiceHasNoResponse('Wallet')
    }
    return {
      status: ResponseCode.Success,
      result: wallets.map(({ name, id }) => ({ name, id })),
    }
  }

  public static async get(id: string): Promise<Controller.Response<Wallet>> {
    const walletsService = WalletsService.getInstance()
    if (typeof id === 'undefined') {
      throw new IsRequired('ID')
    }

    const wallet = walletsService.get(id)
    if (!wallet) {
      throw new WalletNotFound(id)
    }
    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  public static async importMnemonic({
    name,
    password,
    mnemonic,
  }: {
    name: string
    password: string
    mnemonic: string
  }): Promise<Controller.Response<Omit<WalletProperties, 'extendedKey'>>> {
    const result = await WalletsController.createByMnemonic({
      name,
      password,
      mnemonic,
      isImporting: true,
    })

    WalletCreatedSubject.getSubject().next('import')

    return result
  }

  public static async create({
    name,
    password,
    mnemonic,
  }: {
    name: string
    password: string
    mnemonic: string
  }): Promise<Controller.Response<Omit<WalletProperties, 'extendedKey'>>> {
    const result = await WalletsController.createByMnemonic({
      name,
      password,
      mnemonic,
      isImporting: false,
    })

    WalletCreatedSubject.getSubject().next('create')

    return result
  }

  private static async createByMnemonic({
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
    const wallet = walletsService.create({
      id: '',
      name,
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore,
    })

    walletsService.generateAddressesById(wallet.id, isImporting)

    return {
      status: ResponseCode.Success,
      result: {
        id: wallet.id,
        name: wallet.name,
      },
    }
  }

  public static async importKeystore({
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
      accountKeychain.chainCode.toString('hex'),
    )

    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.create({
      id: '',
      name,
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore: keystoreObject,
    })

    await walletsService.generateAddressesById(wallet.id, true)
    WalletCreatedSubject.getSubject().next('import')

    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  // TODO: update addresses?

  public static async update({
    id,
    name,
    password,
    newPassword,
  }: {
    id: string
    password: string
    name: string
    newPassword?: string
  }): Promise<Controller.Response<Wallet>> {
    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.get(id)
    if (!wallet) {
      throw new WalletNotFound(id)
    }

    const props = {
      name: name || wallet.name,
      keystore: wallet.loadKeystore(),
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

  public static async delete({
    id = '',
    password = '',
  }: Controller.Params.DeleteWallet): Promise<Controller.Response<any>> {
    if (password === '') {
      throw new EmptyPassword()
    }
    const walletsService = WalletsService.getInstance()
    if (!walletsService.validate({ id, password })) {
      throw new IncorrectPassword()
    }
    await walletsService.delete(id)

    return {
      status: ResponseCode.Success,
    }
  }

  public static async backup({
    id = '',
    password = '',
  }: Controller.Params.BackupWallet): Promise<Controller.Response<boolean>> {
    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.get(id)

    if (!walletsService.validate({ id, password })) {
      throw new IncorrectPassword()
    }

    const keystore = wallet.loadKeystore()
    return new Promise(resolve => {
      dialog.showSaveDialog(BrowserWindow.getFocusedWindow()!, { title: i18n.t('messages.save-keystore'), defaultPath: wallet.name + '.json' }).then(
        (returnValue: SaveDialogReturnValue) => {
          if (returnValue.filePath) {
            fs.writeFileSync(returnValue.filePath, JSON.stringify(keystore))
            resolve({
              status: ResponseCode.Success,
              result: true,
            })
          }
        })
    })
  }

  public static async getCurrent() {
    const currentWallet = WalletsService.getInstance().getCurrent() || null
    return {
      status: ResponseCode.Success,
      result: currentWallet,
    }
  }

  public static async activate(id: string) {
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

  public static async getAllAddresses(id: string) {
    const addresses = AddressService.allAddressesByWalletId(id).map(
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
        txCount,
        description,
        balance,
        index,
      })
    )
    return {
      status: ResponseCode.Success,
      result: addresses,
    }
  }

  public static async sendTx(params: {
    walletID: string
    tx: TransactionWithoutHash
    password: string
    description?: string
  }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const walletsService = WalletsService.getInstance()
    const hash = await walletsService.sendTx(
      params.walletID,
      params.tx,
      params.password,
      params.description
    )
    return {
      status: ResponseCode.Success,
      result: hash,
    }
  }

  public static async generateTx(params: {
    walletID: string
    items: {
      address: string
      capacity: string
    }[]
    fee: string
    feeRate: string
  }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const addresses: string[] = params.items.map(i => i.address)
    WalletsController.checkAddresses(addresses)

    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.generateTx(
      params.walletID,
      params.items,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public static async generateDepositTx(params: {
    walletID: string,
    capacity: string,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.generateDepositTx(
      params.walletID,
      params.capacity,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public static async startWithdrawFromDao(params: {
    walletID: string,
    outPoint: OutPoint,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.startWithdrawFromDao(
      params.walletID,
      params.outPoint,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public static async withdrawFromDao(params: {
    walletID: string,
    depositOutPoint: OutPoint,
    withdrawingOutPoint: OutPoint,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.withdrawFromDao(
      params.walletID,
      params.depositOutPoint,
      params.withdrawingOutPoint,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public static async generateDepositAllTx(params: {
    walletID: string,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.generateDepositAllTx(
      params.walletID,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public static async updateAddressDescription({
    walletID,
    address,
    description,
  }: {
    walletID: string
    address: string
    description: string
  }) {
    const walletService = WalletsService.getInstance()
    const wallet = walletService.get(walletID)

    AddressService.updateDescription(wallet.id, address, description)

    return {
      status: ResponseCode.Success,
      result: {
        walletID,
        address,
        description,
      },
    }
  }

  private static checkAddresses = (addresses: string[]) => {
    const isMainnet = NetworksService.getInstance().isMainnet()
    addresses.forEach(address => {
      if (isMainnet && !address.startsWith('ckb')) {
        throw new MainnetAddressRequired(address)
      }

      if (!isMainnet && !address.startsWith('ckt')) {
        throw new TestnetAddressRequired(address)
      }

      if (!WalletsController.verifyAddress(address)) {
        throw new InvalidAddress(address)
      }
    })
  }

  private static verifyAddress = (address: string): boolean => {
    if (typeof address !== 'string' || address.length !== 46) {
      return false
    }
    try {
      return parseAddress(address, 'hex').startsWith('0x0100')
    } catch (err) {
      return false
    }
  }
}

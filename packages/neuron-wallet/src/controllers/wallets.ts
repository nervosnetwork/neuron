import fs from 'fs'
import { parseAddress } from '@nervosnetwork/ckb-sdk-utils'
import { dialog, SaveDialogReturnValue, BrowserWindow, OpenDialogReturnValue } from 'electron'
import WalletsService, { Wallet, WalletProperties, FileKeystoreWallet } from 'services/wallets'
import NetworksService from 'services/networks'
import Keystore from 'models/keys/keystore'
import Keychain from 'models/keys/keychain'
import { validateMnemonic, mnemonicToSeedSync } from 'models/keys/mnemonic'
import { AccountExtendedPublicKey, ExtendedPrivateKey, generateMnemonic } from 'models/keys/key'
import CommandSubject from 'models/subjects/command'
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
import i18n from 'locales/i18n'
import AddressService from 'services/addresses'
import { MainnetAddressRequired, TestnetAddressRequired } from 'exceptions/address'
import TransactionSender from 'services/transaction-sender'
import Transaction from 'models/chain/transaction'

export default class WalletsController {
  public async getAll(): Promise<Controller.Response<Pick<Wallet, 'id' | 'name'>[]>> {
    const wallets = WalletsService.getInstance().getAll()
    if (!wallets) {
      throw new ServiceHasNoResponse('Wallet')
    }
    return {
      status: ResponseCode.Success,
      result: wallets.map(({ name, id }) => ({ name, id })),
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

  public async importMnemonic({ name, password, mnemonic }: { name: string, password: string, mnemonic: string }): Promise<Controller.Response<Omit<WalletProperties, 'extendedKey'>>> {
    return await this.createByMnemonic({ name, password, mnemonic, isImporting: true })
  }

  public async create({ name, password, mnemonic }: { name: string, password: string, mnemonic: string }): Promise<Controller.Response<Omit<WalletProperties, 'extendedKey'>>> {
    return await this.createByMnemonic({ name, password, mnemonic, isImporting: false })
  }

  private async createByMnemonic({ name, password, mnemonic, isImporting }: {
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

  public async importKeystore({ name, password, keystorePath }: { name: string, password: string, keystorePath: string }):
    Promise<Controller.Response<Wallet>> {
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

    walletsService.generateAddressesById(wallet.id, true)

    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  public async update({ id, name, password, newPassword }: { id: string, password: string, name: string, newPassword?: string }):
    Promise<Controller.Response<Wallet>> {
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

  public async delete({ id = '', password = '' }: Controller.Params.DeleteWallet): Promise<Controller.Response<any>> {
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

  public async backup({ id = '', password = '' }: Controller.Params.BackupWallet): Promise<Controller.Response<boolean>> {
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

  public async importXPubkey(): Promise<Controller.Response<Wallet>> {
    return new Promise((resolve, reject) => {
      dialog.showOpenDialog(
        BrowserWindow.getFocusedWindow()!,
        {
          title: i18n.t('messages.import-extended-public-key'),
          filters: [{ name: 'JSON File', extensions: ['json'] }]
        }
      ).then((value: OpenDialogReturnValue) => {
        const filePath = value.filePaths[0]
        if (filePath) {
          try {
            const name = filePath.split(/[\\/]/).pop()!.split('.')[0] + "-Watch Only" // File name (without extension)
            const content = fs.readFileSync(filePath, 'utf8')
            const json: { xpubkey: string } = JSON.parse(content)
            const accountExtendedPublicKey = AccountExtendedPublicKey.parse(json.xpubkey)

            const walletsService = WalletsService.getInstance()
            const wallet = walletsService.create({
              id: '',
              name,
              extendedKey: accountExtendedPublicKey.serialize(),
              keystore: Keystore.createEmpty()
            })

            walletsService.generateAddressesById(wallet.id, true)
            resolve({
              status: ResponseCode.Success,
              result: wallet
            })
          } catch {
            reject(new InvalidJSON())
          }
        }
      })
    })
  }

  public async exportXPubkey(id: string = ''): Promise<Controller.Response<boolean>> {
    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.get(id)

    const xpubkey = wallet.accountExtendedPublicKey()
    return new Promise(resolve => {
      dialog.showSaveDialog(BrowserWindow.getFocusedWindow()!, { title: i18n.t('messages.save-extended-public-key'), defaultPath: wallet.name + '-xpubkey.json' })
        .then((returnValue: SaveDialogReturnValue) => {
          if (returnValue.filePath) {
            fs.writeFileSync(returnValue.filePath, JSON.stringify({ xpubkey: xpubkey.serialize() }))
            resolve({
              status: ResponseCode.Success,
              result: true,
            })
          }
        })
    })
  }

  public async getCurrent() {
    const currentWallet = WalletsService.getInstance().getCurrent() || null
    return {
      status: ResponseCode.Success,
      result: currentWallet,
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

  public async sendTx(params: { walletID: string, tx: Transaction, password: string, description?: string }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const hash = await new TransactionSender().sendTx(
      params.walletID,
      Transaction.fromObject(params.tx),
      params.password,
      params.description
    )
    return {
      status: ResponseCode.Success,
      result: hash,
    }
  }

  public async generateTx(params: { walletID: string, items: { address: string, capacity: string }[], fee: string, feeRate: string }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const addresses: string[] = params.items.map(i => i.address)
    this.checkAddresses(addresses)

    const tx: Transaction = await new TransactionSender().generateTx(
      params.walletID,
      params.items,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx
    }
  }

  public async generateSendingAllTx(params: { walletID: string, items: { address: string, capacity: string }[], fee: string, feeRate: string }) {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const addresses: string[] = params.items.map(i => i.address)
    this.checkAddresses(addresses)

    const tx: Transaction = await new TransactionSender().generateSendingAllTx(
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

  public async updateAddressDescription({ walletID, address, description }: { walletID: string, address: string, description: string }) {
    const wallet = WalletsService.getInstance().get(walletID)
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

  public async requestPassword(walletID: string, action: 'delete-wallet' | 'backup-wallet'){
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      CommandSubject.next({
        winID: window.id,
        type: action,
        payload: walletID,
        dispatchToUI: true
      })
    }
  }

  public validateMnemonic(mnemonic: string) {
    return {
      status: ResponseCode.Success,
      result: validateMnemonic(mnemonic)
    }
  }

  public generateMnemonic() {
    return {
      status: ResponseCode.Success,
      result: generateMnemonic()
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

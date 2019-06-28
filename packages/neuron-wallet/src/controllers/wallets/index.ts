import fs from 'fs'
import AppController from '../app'
import WalletsService, { Wallet, WalletProperties, FileKeystoreWallet } from '../../services/wallets'
import Keystore from '../../models/keys/keystore'
import Keychain from '../../models/keys/keychain'
import { validateMnemonic, mnemonicToSeedSync } from '../../models/keys/mnemonic'
import { AccountExtendedPublicKey, ExtendedPrivateKey } from '../../models/keys/key'
import { Controller as ControllerDecorator, CatchControllerError } from '../../decorators'
import { ResponseCode, Channel } from '../../utils/const'
import {
  CurrentWalletNotSet,
  IsRequired,
  WalletNotFound,
  IncorrectPassword,
  InvalidMnemonic,
  EmptyPassword,
  ServiceHasNoResponse,
} from '../../exceptions'
import prompt from '../../utils/prompt'
import i18n from '../../utils/i18n'
import windowManager from '../../models/window-manager'
import AddressService from '../../services/addresses'

const walletsService = WalletsService.getInstance()

/**
 * @class WalletsController
 * @description handle messages from wallets channel
 */
@ControllerDecorator(Channel.Wallets)
export default class WalletsController {
  @CatchControllerError
  public static async getAll(): Promise<Controller.Response<Pick<Wallet, 'id' | 'name'>[]>> {
    const wallets = walletsService.getAll()
    if (!wallets) throw new ServiceHasNoResponse('Wallet')
    return {
      status: ResponseCode.Success,
      result: wallets.map(({ name, id }) => ({ name, id })),
    }
  }

  @CatchControllerError
  public static async get(id: string): Promise<Controller.Response<Wallet>> {
    if (typeof id === 'undefined') throw new IsRequired('ID')

    const wallet = walletsService.get(id)
    if (!wallet) throw new WalletNotFound(id)
    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  @CatchControllerError
  public static async importMnemonic({
    name,
    password,
    mnemonic,
  }: {
    name: string
    password: string
    mnemonic: string
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

    const wallet = walletsService.create({
      id: '',
      name,
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore,
    })

    await walletsService.generateAddressesById(wallet.id)

    return {
      status: ResponseCode.Success,
      result: {
        id: wallet.id,
        name: wallet.name,
      },
    }
  }

  @CatchControllerError
  public static async create({
    name,
    password,
    mnemonic,
  }: {
    name: string
    password: string
    mnemonic: string
  }): Promise<Controller.Response<Omit<WalletProperties, 'extendedKey'>>> {
    return WalletsController.importMnemonic({
      name,
      password,
      mnemonic,
    })
  }

  @CatchControllerError
  public static async importKeystore({
    name,
    password,
    keystore,
  }: {
    name: string
    password: string
    keystore: string
  }): Promise<Controller.Response<Wallet>> {
    if (password === undefined) {
      throw new IsRequired('Password')
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

    const wallet = walletsService.create({
      id: '',
      name,
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore: keystoreObject,
    })
    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  // TODO: update addresses?
  @CatchControllerError
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
    const wallet = walletsService.get(id)
    if (!wallet) throw new WalletNotFound(id)

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

  @CatchControllerError
  public static async delete(id: string): Promise<Controller.Response<any>> {
    const password = await WalletsController.requestPassword(i18n.t('messageBox.remove-wallet.title'))
    if (password === null)
      return {
        status: ResponseCode.Success,
        result: null,
      }

    if (password === '') throw new EmptyPassword()
    if (!walletsService.validate({ id, password })) throw new IncorrectPassword()

    walletsService.delete(id)

    return {
      status: ResponseCode.Success,
      result: {
        allWallets: walletsService.getAll(),
        activeWallet: walletsService.getCurrent(),
      },
    }
  }

  @CatchControllerError
  public static async export({ id, password }: { id: string; password: string }): Promise<Controller.Response<string>> {
    if (!walletsService.validate({ id, password })) throw new IncorrectPassword()
    return {
      status: ResponseCode.Success,
      result: JSON.stringify(walletsService.get(id)),
    }
  }

  @CatchControllerError
  public static async backup(id: string): Promise<Controller.Response<boolean>> {
    const password = await WalletsController.requestPassword(i18n.t('messageBox.backup-keystore.title'))
    if (password === null)
      return {
        status: ResponseCode.Success,
        result: false,
      }
    return WalletsController.downloadKeystore(id, password)
  }

  @CatchControllerError
  public static async getActive() {
    const activeWallet = walletsService.getCurrent()
    if (!activeWallet) {
      throw new CurrentWalletNotSet()
    }
    return {
      status: ResponseCode.Success,
      result: {
        ...activeWallet,
      },
    }
  }

  @CatchControllerError
  public static async activate(id: string) {
    walletsService.setCurrent(id)
    const currentWallet = walletsService.getCurrent() as FileKeystoreWallet
    if (!currentWallet) throw new CurrentWalletNotSet()
    return {
      status: ResponseCode.Success,
      result: currentWallet.toJSON(),
    }
    // TODO: verification
  }

  @CatchControllerError
  public static async getAllAddresses(id?: string) {
    let walletId = id
    if (walletId === undefined) {
      const currentWallet = walletsService.getCurrent()
      if (currentWallet) {
        walletId = currentWallet.id
      }
    }

    if (walletId === undefined) {
      throw new CurrentWalletNotSet()
    }
    const addresses = await AddressService.allAddressesByWalletId(walletId).then(addrs =>
      addrs.map(({ address, blake160: identifier, addressType: type, txCount, balance, description = '' }) => ({
        address,
        identifier,
        type,
        txCount,
        description,
        balance,
      }))
    )
    return {
      status: ResponseCode.Success,
      result: addresses,
    }
  }

  @CatchControllerError
  public static async sendCapacity(params: {
    id: string
    items: {
      address: string
      capacity: string
    }[]
    fee: string
    description?: string
  }) {
    const password = await WalletsController.requestPassword(i18n.t('messageBox.send-capacity.title'))
    if (password === null)
      return {
        status: ResponseCode.Success,
        result: '',
      }
    if (!params) throw new IsRequired('Parameters')
    try {
      windowManager.broadcast(Channel.Wallets, 'sendingStatus', {
        status: ResponseCode.Success,
        result: true,
      })
      const hash = await walletsService.sendCapacity(params.items, password, params.fee, params.description)
      return {
        status: ResponseCode.Success,
        result: hash,
      }
    } catch (err) {
      return {
        status: ResponseCode.Fail,
        msg: {
          content: `Error: "${err.message}"`,
          id: params.id,
        },
      }
    } finally {
      windowManager.broadcast(Channel.Wallets, 'sendingStatus', {
        status: ResponseCode.Success,
        result: false,
      })
    }
  }

  @CatchControllerError
  public static async updateAddressDescription({ address, description }: { address: string; description: string }) {
    // TODO: update description of specified address

    return {
      status: ResponseCode.Success,
      result: {
        address,
        description,
      },
    }
  }

  private static async requestPassword(title: string): Promise<string | null> {
    const password = (await prompt('password', {
      title,
    })) as string | null
    return password
  }

  private static async downloadKeystore(id: string, password: string): Promise<Controller.Response<boolean>> {
    if (password === '') throw new EmptyPassword()
    const wallet = await walletsService.get(id)

    if (!walletsService.validate({ id, password })) throw new IncorrectPassword()

    const keystore = wallet.loadKeystore()
    return new Promise(resolve => {
      AppController.showSaveDialog(
        {
          title: i18n.t('messages.save-keystore'),
          defaultPath: wallet.name,
        },
        (filename?: string) => {
          if (filename) {
            fs.writeFileSync(filename, JSON.stringify(keystore))
            resolve({
              status: ResponseCode.Success,
              result: true,
            })
          }
        }
      )
    })
  }
}

/* eslint-disable */
declare global {
  module Controller {
    type WalletsMethod = Exclude<keyof typeof WalletsController, keyof typeof Object | 'service'>
  }
}
/* eslint-enable */

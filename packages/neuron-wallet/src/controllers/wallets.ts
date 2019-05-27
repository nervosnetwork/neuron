import WalletsService, { Wallet, WalletProperties } from '../services/wallets'
import Key from '../keys/key'
import { CatchControllerError } from '../decorators'
import windowManage from '../utils/windowManage'
import { Channel, ResponseCode } from '../utils/const'
import i18n from '../utils/i18n'

export enum WalletsMethod {
  GetAll = 'getAll',
  Get = 'get',
  GenerateMnemonic = 'generateMnemonic',
  ImportMnemonic = 'importMnemonic',
  ImportKeystore = 'importKeystore',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  GetActive = 'getActive',
  Activate = 'activate',
  SendCapacity = 'sendCapacity',
}

/**
 * @class WalletsController
 * @description handle messages from wallets channel
 */
class WalletsController {
  static service = new WalletsService()

  @CatchControllerError
  public static async getAll() {
    const wallets = WalletsController.service.getAll()
    if (!wallets) throw new Error(i18n.t('wallets-service-not-responds', { services: i18n.t('services.wallets') }))
    return {
      status: ResponseCode.Success,
      result: wallets,
    }
  }

  @CatchControllerError
  public static async get(id: string): Promise<Controller.Response<Wallet>> {
    if (typeof id === 'undefined') throw new Error(i18n.t('messages.id-is-required'))

    const wallet = WalletsController.service.get(id)
    if (!wallet) throw new Error(i18n.t('messages.wallet-is-not-found', { id }))
    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  @CatchControllerError
  public static async generateMnemonic(): Promise<Controller.Response<string>> {
    const mnemonic = Key.generateMnemonic()
    if (!mnemonic) throw new Error(i18n.t('messages.failed-to-create-mnemonic'))
    return {
      status: ResponseCode.Success,
      result: mnemonic,
    }
  }

  @CatchControllerError
  public static async importMnemonic({
    name,
    password,
    mnemonic,
    receivingAddressNumber = 20,
    changeAddressNumber = 10,
  }: {
    name: string
    password: string
    mnemonic: string
    receivingAddressNumber: number
    changeAddressNumber: number
  }): Promise<Controller.Response<Wallet>> {
    const key = await Key.fromMnemonic(mnemonic, password, receivingAddressNumber, changeAddressNumber)
    const currentWallet = WalletsController.service.getCurrent()
    const wallet = WalletsController.service.create({
      name,
      keystore: key.keystore || null,
      addresses: key.addresses || {
        receiving: [],
        change: [],
      },
    })
    // TODO: use event listener on wallets service
    windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, await WalletsController.getAll())
    if (!currentWallet && WalletsController.service.getAll().length === 1) {
      windowManage.broadcast(Channel.Wallets, WalletsMethod.GetActive, await WalletsController.getActive())
    }
    return {
      status: ResponseCode.Success,
      result: wallet,
    }
  }

  @CatchControllerError
  public static async create({
    name,
    password,
    mnemonic,
    receivingAddressNumber = 20,
    changeAddressNumber = 10,
  }: {
    name: string
    password: string
    mnemonic: string
    receivingAddressNumber: number
    changeAddressNumber: number
  }): Promise<Controller.Response<Wallet>> {
    return WalletsController.importMnemonic({
      name,
      password,
      mnemonic,
      receivingAddressNumber,
      changeAddressNumber,
    })
  }

  @CatchControllerError
  public static async importKeystore({
    name,
    password,
    keystore,
    receivingAddressNumber = 20,
    changeAddressNumber = 10,
  }: {
    name: string
    password: string
    keystore: string
    receivingAddressNumber: number
    changeAddressNumber: number
  }): Promise<Controller.Response<Wallet>> {
    const key = await Key.fromKeystore(keystore, password, receivingAddressNumber, changeAddressNumber)
    const wallet = WalletsController.service.create({
      name,
      keystore: key.keystore || null,
      addresses: key.addresses || { receiving: [], change: [] },
    })
    // TODO: use event listener on wallets service
    windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, await WalletsController.getAll())
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
    const wallet = WalletsController.service.get(id)
    if (!wallet) throw new Error(i18n.t('wallet-is-not-found', { id }))

    const props: WalletProperties = {
      name: name || wallet.name,
      addresses: wallet.addresses,
      keystore: wallet.loadKeystore(),
    }

    if (newPassword) {
      if (WalletsController.service.validate({ id, password })) {
        const key = await Key.fromKeystore(JSON.stringify(wallet!.loadKeystore()), password)
        props.keystore = key.toKeystore(JSON.stringify(key.keysData!), newPassword)
      } else {
        throw new Error(i18n.t('messages.wallet-incorrect-password'))
      }
    }

    WalletsController.service.update(id, props)
    // TODO: use event listener on wallets service
    windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, await WalletsController.getAll())
    return {
      status: ResponseCode.Success,
      result: WalletsController.service.get(id),
    }
  }

  @CatchControllerError
  public static async delete({ id, password }: { id: string; password: string }): Promise<Controller.Response<any>> {
    if (!WalletsController.service.validate({ id, password }))
      throw new Error(i18n.t('messages.wallet-incorrect-password'))

    WalletsController.service.delete(id)

    return {
      status: ResponseCode.Success,
      result: {
        allWallets: WalletsController.service.getAll(),
        activeWallet: WalletsController.service.getCurrent(),
      },
    }
  }

  @CatchControllerError
  public static async export({ id, password }: { id: string; password: string }): Promise<Controller.Response<string>> {
    if (!WalletsController.service.validate({ id, password })) {
      throw new Error(i18n.t('messages.wallet-incorrect-password'))
    }
    return {
      status: ResponseCode.Success,
      result: JSON.stringify(WalletsController.service.get(id)),
    }
  }

  @CatchControllerError
  public static async getActive() {
    const activeWallet = WalletsController.service.getCurrent()
    if (!activeWallet) {
      throw new Error(i18n.t('messages.no-active-wallet'))
    }
    return {
      status: ResponseCode.Success,
      result: {
        ...activeWallet,
        addresses: {
          receiving: activeWallet.addresses.receiving.map(addr => addr.address),
          change: activeWallet.addresses.change.map(addr => addr.address),
        },
      },
    }
  }

  @CatchControllerError
  public static async activate(id: string) {
    WalletsController.service.setCurrent(id)
    // TODO: use event listener on wallets service
    windowManage.broadcast(Channel.Wallets, WalletsMethod.GetActive, await WalletsController.getActive())
    return {
      status: ResponseCode.Success,
      result: WalletsController.service.getCurrent(),
    }
    // TODO: verification
  }

  @CatchControllerError
  public static async sendCapacity(params: {
    id: string
    items: {
      address: CKBComponents.Hash256
      capacity: CKBComponents.Capacity
      unit: 'byte' | 'shannon'
    }[]
    password: string
  }) {
    if (!params) throw new Error(i18n.t('messages.parameters-of-sending-transactions-are-required'))
    try {
      const hash = await WalletsController.service.sendCapacity(params.items, params.password)
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
    }
  }
}

export default WalletsController

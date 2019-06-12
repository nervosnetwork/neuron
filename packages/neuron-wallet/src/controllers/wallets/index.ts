import WalletsService, { Wallet, WalletProperties } from '../../services/wallets'
import Key from '../../keys/key'
import { Controller as ControllerDecorator, CatchControllerError } from '../../decorators'
import { ResponseCode, Channel } from '../../utils/const'
import {
  CurrentWalletNotSet,
  IsRequired,
  WalletNotFound,
  IncorrectPassword,
  ServiceHasNoResponse,
} from '../../exceptions'

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
    receivingAddressNumber = 20,
    changeAddressNumber = 10,
  }: {
    name: string
    password: string
    mnemonic: string
    receivingAddressNumber: number
    changeAddressNumber: number
  }): Promise<Controller.Response<Omit<Wallet, 'loadKeystore'>>> {
    const key = await Key.fromMnemonic(mnemonic, password, receivingAddressNumber, changeAddressNumber)
    const wallet = walletsService.create({
      name,
      keystore: key.keystore || null,
      addresses: key.addresses || {
        receiving: [],
        change: [],
      },
    })
    return {
      status: ResponseCode.Success,
      result: {
        id: wallet.id,
        name: wallet.name,
        addresses: wallet.addresses,
      },
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
  }): Promise<Controller.Response<Omit<Wallet, 'loadKeystore'>>> {
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
    const wallet = walletsService.create({
      name,
      keystore: key.keystore || null,
      addresses: key.addresses || { receiving: [], change: [] },
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

    const props: WalletProperties = {
      name: name || wallet.name,
      addresses: wallet.addresses,
      keystore: wallet.loadKeystore(),
    }

    if (newPassword) {
      if (walletsService.validate({ id, password })) {
        const key = await Key.fromKeystore(JSON.stringify(wallet!.loadKeystore()), password)
        props.keystore = key.toKeystore(JSON.stringify(key.keysData!), newPassword)
      } else {
        throw new IncorrectPassword()
      }
    }

    walletsService.update(id, props)
    return {
      status: ResponseCode.Success,
      result: walletsService.get(id),
    }
  }

  @CatchControllerError
  public static async delete({ id, password }: { id: string; password: string }): Promise<Controller.Response<any>> {
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
  public static async getActive() {
    const activeWallet = walletsService.getCurrent()
    if (!activeWallet) {
      throw new CurrentWalletNotSet()
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
    walletsService.setCurrent(id)
    const currentWallet = walletsService.getCurrent()
    if (!currentWallet) throw new CurrentWalletNotSet()
    return {
      status: ResponseCode.Success,
      result: currentWallet.toJSON(),
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
    if (!params) throw new IsRequired('Parameters')
    try {
      const hash = await walletsService.sendCapacity(params.items, params.password)
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

/* eslint-disable */
declare global {
  module Controller {
    type WalletsMethod = Exclude<keyof typeof WalletsController, keyof typeof Object | 'service'>
  }
}
/* eslint-enable */

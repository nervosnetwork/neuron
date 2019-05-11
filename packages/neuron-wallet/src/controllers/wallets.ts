import WalletsService from '../services/wallets'
import { Wallet } from '../store/walletStore'
import { ChannelResponse, ResponseCode } from '.'
import windowManage from '../utils/windowManage'
import { Channel } from '../utils/const'
import Key from '../keys/key'

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
}

class WalletsController {
  static service = new WalletsService()

  public static getAll = (): ChannelResponse<Wallet[]> => {
    const wallets = WalletsController.service.getAll()
    if (wallets) {
      return {
        status: ResponseCode.Success,
        result: wallets,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Wallets not found',
    }
  }

  public static get = (id: string): ChannelResponse<Wallet> => {
    const wallet = WalletsController.service.get(id)
    if (wallet) {
      return {
        status: ResponseCode.Success,
        result: wallet,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Wallet not found',
    }
  }

  public static generateMnemonic = (): ChannelResponse<string> => {
    const mnemonic = Key.generateMnemonic()
    if (mnemonic) {
      return {
        status: ResponseCode.Success,
        result: mnemonic,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Failed to create mnemonic',
    }
  }

  public static importMnemonic = async ({
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
  }): Promise<ChannelResponse<Wallet>> => {
    try {
      const key = await Key.fromMnemonic(mnemonic, password, receivingAddressNumber, changeAddressNumber)
      const wallet = WalletsController.service.create({
        name,
        keystore: key.keystore!,
        addresses: key.addresses!,
      })
      windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, WalletsController.getAll())
      return {
        status: ResponseCode.Success,
        result: wallet,
      }
    } catch (e) {
      return {
        status: ResponseCode.Fail,
        msg: e.message,
      }
    }
  }

  public static create = async ({
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
  }): Promise<ChannelResponse<Wallet>> => {
    const res = await WalletsController.importMnemonic({
      name,
      password,
      mnemonic,
      receivingAddressNumber,
      changeAddressNumber,
    })
    return res
  }

  public static importKeystore = ({
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
  }): ChannelResponse<Wallet> => {
    try {
      const key = Key.fromKeystore(keystore, password, receivingAddressNumber, changeAddressNumber)
      const wallet = WalletsController.service.create({
        name,
        keystore: key.keystore!,
        addresses: key.addresses!,
      })
      windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, WalletsController.getAll())
      return {
        status: ResponseCode.Success,
        result: wallet,
      }
    } catch (e) {
      return {
        status: ResponseCode.Fail,
        msg: e.message,
      }
    }
  }

  public static update = ({
    id,
    name,
    password,
    newPassword,
  }: {
    id: string
    password: string
    name: string
    newPassword?: string
  }): ChannelResponse<Wallet> => {
    try {
      const wallet = WalletsController.service.get(id)
      if (wallet) {
        if (WalletsController.service.validate({ id, password })) {
          wallet.name = name
          if (newPassword) {
            const key = Key.fromKeystore(JSON.stringify(wallet!.keystore), password)
            wallet.keystore = key.toKeystore(JSON.stringify(key.keysData!), newPassword)
          }
          WalletsController.service.update(id, wallet)
          windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, WalletsController.getAll())
          return {
            status: ResponseCode.Success,
            result: WalletsController.service.get(id),
          }
        }
        return {
          status: ResponseCode.Fail,
          msg: 'Incorrect password',
        }
      }
      return {
        status: ResponseCode.Fail,
        msg: 'Wallet not found',
      }
    } catch (e) {
      return {
        status: ResponseCode.Fail,
        msg: e.message,
      }
    }
  }

  public static delete = ({ id, password }: { id: string; password: string }): ChannelResponse<any> => {
    if (WalletsController.service.validate({ id, password })) {
      if (WalletsController.service.delete(id)) {
        return {
          status: ResponseCode.Success,
          result: {
            allWallets: WalletsController.service.getAll(),
            activeWallet: WalletsController.service.getActive(),
          },
        }
      }

      return {
        status: ResponseCode.Fail,
        msg: 'Failed to delete wallet',
      }
    }

    return {
      status: ResponseCode.Fail,
      msg: 'Incorrect password',
    }
  }

  public static export = ({ id, password }: { id: string; password: string }): ChannelResponse<string> => {
    if (WalletsController.service.validate({ id, password })) {
      return {
        status: ResponseCode.Success,
        result: JSON.stringify(WalletsController.service.get(id)),
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Incorrect password',
    }
  }

  public static getActive = () => {
    try {
      const activeWallet = WalletsController.service.getActive()
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
    } catch (e) {
      return {
        status: ResponseCode.Fail,
        msg: 'No active wallet',
      }
    }
  }

  public static activate = (id: string) => {
    const success = WalletsController.service.setActive(id)
    if (success) {
      windowManage.broadcast(Channel.Wallets, WalletsMethod.GetActive, WalletsController.getActive())
      return {
        status: ResponseCode.Success,
        result: WalletsController.service.getActive(),
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Failed to activate wallet',
    }
    // TODO: verification
  }
}

export default WalletsController

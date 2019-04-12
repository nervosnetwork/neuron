import WalletChannel from '../channel/wallet'
import WalletsService from '../services/wallets'
import { WalletData } from '../store/walletStore'
import { ChannelResponse, ResponseCode } from '.'
import windowManage from '../main'
import { Channel } from '../utils/const'
import Key from '../keys/key'

export enum WalletsMethod {
  GetAll = 'getAll',
  Get = 'get',
  GenerateMnemonic = 'generateMnemonic',
  ImportMnemonic = 'importMnemonic',
  ImportKeystore = 'importKeystore',
  Update = 'update',
  Delete = 'delete',
  GetActive = 'getActive',
  Activate = 'activate',
}

class WalletsController {
  public channel: WalletChannel

  static service = new WalletsService()

  constructor(channel: WalletChannel) {
    this.channel = channel
  }

  public static getAll = (): ChannelResponse<WalletData[]> => {
    const wallets = WalletsController.service.getAll()
    if (wallets.length > 0) {
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

  public static get = (id: string): ChannelResponse<WalletData> => {
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

  public static importMnemonic = ({
    name,
    password,
    mnemonic,
    receivingAddressNumber = 17,
    changeAddressNumber = 3,
  }: {
    name: string
    password: string
    mnemonic: string
    receivingAddressNumber: number
    changeAddressNumber: number
  }): ChannelResponse<WalletData> => {
    try {
      const key = Key.fromMnemonic(mnemonic, password, receivingAddressNumber, changeAddressNumber)
      const wallet = WalletsController.service.create({
        name,
        keystore: key.keystore!,
        addresses: key.addresses!,
      })
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

  public static importKeystore = ({
    name,
    password,
    keystore,
    receivingAddressNumber = 17,
    changeAddressNumber = 3,
  }: {
    name: string
    password: string
    keystore: string
    receivingAddressNumber: number
    changeAddressNumber: number
  }): ChannelResponse<WalletData> => {
    try {
      const key = Key.fromKeystore(keystore, password, receivingAddressNumber, changeAddressNumber)
      const wallet = WalletsController.service.create({
        name,
        keystore: key.keystore!,
        addresses: key.addresses!,
      })
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

  public static delete = ({ id, password }: { id: string; password: string }): ChannelResponse<boolean> => {
    if (WalletsController.service.validate({ id, password })) {
      const success = WalletsController.service.delete(id)
      if (success) {
        // TODO: details, what to do when active wallet deleted
        windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, WalletsController.getAll())
        return {
          status: ResponseCode.Success,
          result: true,
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
    // if (activeWallet) {
    //   return {
    //     status: ResponseCode.Success,
    //     result: {
    //       name: 'active wallet',
    //       address: activeWallet.address,
    //       publicKey: activeWallet.publicKey,
    //     },
    //   }
    // }
    return {
      status: ResponseCode.Fail,
      msg: 'No active wallet',
    }
  }

  public static activate = (id: string) => {
    const success = WalletsController.service.setActive(id)
    if (success) {
      return {
        status: ResponseCode.Success,
        result: WalletsController.service.active,
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

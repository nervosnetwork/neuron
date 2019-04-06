import WalletChannel from '../channel/wallet'
import WalletsService from '../services/wallets'
import { WalletData } from '../store/WalletStore'
import { ChannelResponse, ResponseCode } from '.'
import asw from '../wallets/asw'
import windowManage from '../main'
import { Channel } from '../utils/const'
import Key from '../keys/key'

const activeWallet = asw

export enum WalletsMethod {
  Index = 'index',
  GenerateMnemonic = 'generateMnemonic',
  ImportMnemonic = 'importMnemonic',
  ImportKeystore = 'importKeystore',
  Update = 'update',
  Delete = 'delete',
  Active = 'active',
  SetActive = 'setActive',
}

class WalletsController {
  public channel: WalletChannel

  static service = new WalletsService()

  constructor(channel: WalletChannel) {
    this.channel = channel
  }

  public static getAll = (): ChannelResponse<WalletData[]> => {
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
      msg: 'Failed to create wallet',
    }
  }

  public static importMnemonic = ({
    name,
    password,
    mnemonic,
    receiveAddressNumber = 17,
    changeAddressNumber = 3,
  }: {
    name: string
    password: string
    mnemonic: string
    receiveAddressNumber: number
    changeAddressNumber: number
  }): ChannelResponse<WalletData> => {
    try {
      const key = Key.fromMnemonic(mnemonic, password, receiveAddressNumber, changeAddressNumber)
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
    receiveAddressNumber = 17,
    changeAddressNumber = 3,
  }: {
    name: string
    password: string
    keystore: string
    receiveAddressNumber: number
    changeAddressNumber: number
  }): ChannelResponse<WalletData> => {
    try {
      const key = Key.fromKeystore(keystore, password, receiveAddressNumber, changeAddressNumber)
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

  // TODO: implement service.update
  // public static update = ({
  //   id,
  //   name,
  //   address,
  //   publicKey,
  //   password,
  // }: {
  //   id: string
  //   name?: string
  //   address?: string
  //   publicKey?: Uint8Array
  //   password: string
  // }): ChannelResponse<boolean> => {
  //   const wallet = WalletsController.service.show(id)
  //   const isPermitted = verifyPassword(wallet, password)
  //   if (!isPermitted) {
  //     return {
  //       status: ResponseCode.Fail,
  //       msg: 'Incorrect password',
  //     }
  //   }
  //   const success = WalletsController.service.update({
  //     id,
  //     name,
  //     address,
  //     publicKey,
  //   })
  //   if (success) {
  //     windowManage.broadcast(Channel.Wallets, WalletsMethod.Index, WalletsController.index())
  //     return {
  //       status: ResponseCode.Success,
  //       result: true,
  //     }
  //   }
  //   return {
  //     status: ResponseCode.Fail,
  //     msg: 'Failed to update wallet',
  //   }
  // }

  public static delete = ({ id, password }: { id: string; password: string }): ChannelResponse<boolean> => {
    if (WalletsController.service.validate({ id, password })) {
      const success = WalletsController.service.delete(id)
      if (success) {
        // TODO: details, what to do when active wallet deleted
        windowManage.broadcast(Channel.Wallets, WalletsMethod.Index, WalletsController.getAll())
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

  public static active = () => {
    if (activeWallet) {
      return {
        status: ResponseCode.Success,
        result: {
          name: 'active wallet',
          address: activeWallet.address,
          publicKey: activeWallet.publicKey,
        },
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'No active wallet',
    }
  }

  public static setActive = (id: string) => {
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

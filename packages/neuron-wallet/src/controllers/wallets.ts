import WalletsService, { Wallet, WalletProperties } from '../services/wallets'
import { ChannelResponse, ResponseCode } from '.'
import windowManage from '../utils/windowManage'
import { Channel, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '../utils/const'
import Key from '../keys/key'
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
      WalletsController.verifyPasswordComplexity(password)
      const key = await Key.fromMnemonic(mnemonic, password, receivingAddressNumber, changeAddressNumber)
      const currentWallet = WalletsController.service.getCurrent()
      const wallet = WalletsController.service.create({
        name,
        keystore: key.keystore!,
        addresses: key.addresses!,
      })
      windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, WalletsController.getAll())
      if (!currentWallet && WalletsController.service.getAll().length === 1) {
        windowManage.broadcast(Channel.Wallets, WalletsMethod.GetActive, WalletsController.getActive())
      }
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
      WalletsController.verifyPasswordComplexity(password)
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

  public static verifyPasswordComplexity = (password: string) => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw Error(i18n.t('messages.wallet-password-less-than-min-length', { minPasswordLength: MIN_PASSWORD_LENGTH }))
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      throw Error(i18n.t('messages.wallet-password-more-than-max-length', { maxPasswordLength: MAX_PASSWORD_LENGTH }))
    }
    let complex = 0
    let reg = /\d/
    if (reg.test(password)) {
      complex++
    }
    reg = /[a-z]/
    if (reg.test(password)) {
      complex++
    }
    reg = /[A-Z]/
    if (reg.test(password)) {
      complex++
    }
    reg = /[^0-9a-zA-Z]/
    if (reg.test(password)) {
      complex++
    }
    if (complex < 3) {
      throw Error(i18n.t('messages.wallet-password-letter-complexity'))
    }
  }

  // TODO: update addresses?
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
        const props: WalletProperties = {
          name: wallet.name,
          addresses: wallet.addresses,
          keystore: wallet.loadKeystore(),
        }
        if (newPassword) {
          if (WalletsController.service.validate({ id, password })) {
            WalletsController.verifyPasswordComplexity(password)
            const key = Key.fromKeystore(JSON.stringify(wallet!.loadKeystore()), password)
            props.keystore = key.toKeystore(JSON.stringify(key.keysData!), newPassword)
          } else {
            return {
              status: ResponseCode.Fail,
              msg: 'Incorrect password',
            }
          }
        }
        if (name) {
          props.name = name
        }
        WalletsController.service.update(id, props)
        windowManage.broadcast(Channel.Wallets, WalletsMethod.GetAll, WalletsController.getAll())
        return {
          status: ResponseCode.Success,
          result: WalletsController.service.get(id),
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
            activeWallet: WalletsController.service.getCurrent(),
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
    const activeWallet = WalletsController.service.getCurrent()
    if (activeWallet) {
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

    return {
      status: ResponseCode.Fail,
      msg: 'No active wallet',
    }
  }

  public static activate = (id: string) => {
    const success = WalletsController.service.setCurrent(id)
    if (success) {
      windowManage.broadcast(Channel.Wallets, WalletsMethod.GetActive, WalletsController.getActive())
      return {
        status: ResponseCode.Success,
        result: WalletsController.service.getCurrent(),
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Failed to activate wallet',
    }
    // TODO: verification
  }

  public static sendCapacity = async (params: {
    id: string
    items: {
      address: CKBComponents.Hash256
      capacity: CKBComponents.Capacity
      unit: 'byte' | 'shannon'
    }[]
    password: string
  }) => {
    if (!params) {
      return {
        status: ResponseCode.Fail,
        msg: 'Parameters not received',
      }
    }
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

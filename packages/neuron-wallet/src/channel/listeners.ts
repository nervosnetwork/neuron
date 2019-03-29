import { ipcMain, Notification, Menu } from 'electron'

import { Channel } from '../utils/const'
import { wallets, verifyPassword, updateWallets, Wallet } from '../mock'
import asw from '../wallets/asw'
import { ResponseCode } from './wallet'
import NetworksController from '../controllers/netowrks'
import TransactionsController from '../controllers/transactions'
import WalletsController from '../controllers/wallets'
import { contextMenuTemplates } from '../utils/templates'

export enum ContextMenuTarget {
  History = 'history',
  NetworksSetting = 'networksSetting',
}

const checkPassword = (walletID: string, password: string) => {
  const myWallet = wallets().find(wallet => wallet.id === walletID)
  if (!myWallet) {
    return {
      status: ResponseCode.Success,
      result: false,
      msg: 'Wallet not found',
    }
  }
  if (verifyPassword(myWallet, password)) {
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }
  return {
    status: ResponseCode.Success,
    result: false,
    msg: 'Wrong password',
  }
}

export default class Listeners {
  static start = (
    methods: string[] = [
      'deleteWallet',
      'editWallet',
      'switchWallet',
      'getBalance',
      'asw',
      'getWallets',
      'checkWalletPassword',
      'sendCapacity',
      'networks',
      'transactions',
      'contextMenu',
    ],
  ) => {
    methods.forEach(method => {
      const descriptor = Object.getOwnPropertyDescriptor(Listeners, method)
      if (descriptor) {
        descriptor.value()
      }
    })
  }

  // wallet

  /**
   * @static checkWalletPassword
   * @memberof ChannelListeners
   * @description channel to check wallets password
   */
  static checkWalletPassword = () => {
    return ipcMain.on(
      Channel.CheckWalletPassword,
      (e: Electron.Event, { walletID, password }: { walletID: string; password: string }) => {
        e.sender.send(Channel.CheckWalletPassword, checkPassword(walletID, password))
      },
    )
  }

  /**
   * @static deleteWallet
   * @memberof ChannelListeners
   * @description channel to delete wallet
   */
  static deleteWallet = () => {
    return ipcMain.on(
      Channel.DeleteWallet,
      (e: Electron.Event, { walletID, password }: { walletID: string; password: string }) => {
        const args = checkPassword(walletID, password)
        if (args.result) {
          const walletList = wallets()
          const index = walletList.findIndex(wallet => wallet.id === walletID)
          walletList.splice(index, 1)
          updateWallets(walletList)
        }
        e.sender.send(Channel.DeleteWallet, args)
      },
    )
  }

  /**
   * @static editWallet
   * @memberof ChannelListeners
   * @description channel to edit wallet
   */
  static editWallet = () => {
    return ipcMain.on(
      Channel.EditWallet,
      (
        e: Electron.Event,
        {
          walletID,
          walletName,
          password,
          newPassword,
        }: { walletID: string; walletName: string; password: string; newPassword: string },
      ) => {
        const args = checkPassword(walletID, password)
        if (args.result) {
          const wallet = wallets().find(item => item.id === walletID)
          if (wallet) {
            wallet.name = walletName
            wallet.password = newPassword
          }
        }
        e.sender.send(Channel.EditWallet, args)
      },
    )
  }

  /**
   * @static switchWallet
   * @memberof ChannelListeners
   * @description channel to switch wallet
   */
  static switchWallet = () => {
    return ipcMain.on(Channel.SwitchWallet, (e: Electron.Event, wallet: Wallet) => {
      e.sender.send(Channel.SwitchWallet, {
        status: ResponseCode.Success,
        result: wallet.name,
      })
    })
  }

  /**
   * @static getBalance
   * @memberof ChannelListeners
   * @description channel to get balance
   */
  static getBalance = () => {
    return ipcMain.on(Channel.GetBalance, (e: Electron.Event) => {
      e.sender.send(Channel.GetBalance, {
        status: ResponseCode.Success,
        result: `balance`,
      })
    })
  }

  /**
   * @static asw
   * @memberof ChannelListeners
   * @description channel to get asw
   */
  static asw = () => {
    return ipcMain.on(`ASW`, (e: Electron.Event) => {
      e.sender.send(`ASW`, {
        status: ResponseCode.Success,
        result: asw,
      })
    })
  }

  /**
   * @static getWallets
   * @memberof ChannelListeners
   * @description channel to get wallets
   */
  static getWallets = () => {
    return ipcMain.on(Channel.GetWallets, (e: Electron.Event) => {
      e.sender.send(Channel.GetWallets, {
        status: ResponseCode.Success,
        result: wallets(),
      })
    })
  }

  /**
   * @static sendCapacity
   * @memberof ChannelListeners
   * @description channel to send capacity
   */
  static sendCapacity = () => {
    return ipcMain.on(
      Channel.SendCapacity,
      (
        e: Electron.Event,
        { items, password }: { items: { address: string; capacity: string; unit: string }[]; password: string },
      ) => {
        setTimeout(() => {
          if (!items.length || !items[0].address) {
            e.returnValue = {
              status: ResponseCode.Fail,
              msg: 'Address not specified',
            }
            return
          }
          // TODO: verify password
          // TODO: verify capacity
          const notification = new Notification({
            title: `Send Capacity`,
            body: `Send Capacity to CKB with ${JSON.stringify(
              {
                items,
                password,
              },
              null,
              2,
            )}`,
          })
          notification.show()
          e.returnValue = {
            status: ResponseCode.Success,
            msg: `Send Successfully`,
          }
        }, 3000)
      },
    )
  }

  /**
   * @method networks
   * @memberof ChannelListeners
   * @description listen to Channel.Networks and invoke corresponding method of networksController
   */
  public static networks = () => {
    return ipcMain.on(Channel.Networks, (e: Electron.Event, method: keyof typeof NetworksController, params: any) => {
      e.sender.send(Channel.Networks, method, (NetworksController[method] as Function)(params))
    })
  }

  /**
   * @method transactions
   * @memberof ChannelListeners
   * @description listen to Channel.Transactions and invoke corresponding method of transactionsController
   */
  public static transactions = () => {
    return ipcMain.on(
      Channel.Transactions,
      (e: Electron.Event, method: keyof typeof TransactionsController, params: any) => {
        e.sender.send(Channel.Transactions, method, (TransactionsController[method] as Function)(params))
      },
    )
  }

  /**
   * @method wallet
   * @memberof ChannelListeners
   * @description listen to Channel.Wallet and invoke corresponding method of WalletsController
   */
  public static wallet = () => {
    return ipcMain.on(Channel.Wallets, (e: Electron.Event, method: keyof typeof WalletsController, params: any) => {
      e.sender.send(Channel.Wallets, method, (WalletsController[method] as Function)(params))
    })
  }

  public static contextMenu = () => {
    return ipcMain.on(Channel.ContextMenu, (e: Electron.Event, target: ContextMenuTarget, params: any) => {
      switch (target) {
        case ContextMenuTarget.History: {
          const menu = Menu.buildFromTemplate(contextMenuTemplates.history(e, params))
          menu.popup()
          break
        }
        case ContextMenuTarget.NetworksSetting: {
          const menu = Menu.buildFromTemplate(contextMenuTemplates.networksSetting(e, params))
          menu.popup()
          break
        }
        default: {
          break
        }
      }
    })
  }
}

import { ipcMain, Notification } from 'electron'

import { Channel } from '../utils/const'
import { transactions, transactionCount, wallets, validatePassword, updateWallets, Wallet } from '../mock'
import asw from '../wallets/asw'
import { ResponseCode } from './wallet'
import NetworksController from '../controllers/netowrks'
import TransactionsController from '../controllers/transactions'

const checkPassword = (walletID: string, password: string) => {
  const myWallet = wallets().find(wallet => wallet.id === walletID)
  if (!myWallet) {
    return {
      status: ResponseCode.Success,
      result: false,
      msg: 'Wallet not found',
    }
  }
  if (validatePassword(myWallet, password)) {
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

// controll styled code
export default class Listeners {
  static start = (
    methods: string[] = [
      'deleteWallet',
      'editWallet',
      'switchWallet',
      'getBalance',
      'asw',
      'getUnspentCells',
      'getTransaction',
      'getTransactions',
      'getWallets',
      'checkWalletPassword',
      'sendCapacity',
      // controller style code
      'networks',
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
   * @static getUnspentCells
   * @memberof ChannelListeners
   * @description channel to get unspent cells
   */
  static getUnspentCells = () => {
    return ipcMain.on(Channel.GetUnspentCells, (e: Electron.Event) => {
      e.sender.send(Channel.GetUnspentCells, {
        status: ResponseCode.Success,
        result: [`cell`],
      })
    })
  }

  /**
   * @static getTransaction
   * @memberof ChannelListeners
   * @description get transaction by hash
   */
  static getTransaction = () => {
    return ipcMain.on(Channel.GetTransaction, (e: Electron.Event, { hash }: { hash: string }) => {
      const transaction = transactions.find(tx => `${tx.hash}` === hash)
      if (transaction) {
        e.sender.send(Channel.GetTransaction, {
          status: ResponseCode.Success,
          result: transaction,
        })
      } else {
        e.sender.send(Channel.GetTransaction, {
          status: ResponseCode.Fail,
          msg: `Transaction of ${hash} is not found`,
        })
      }
    })
  }

  /**
   * @static getTransactions
   * @memberof ChannelListeners
   * @description get transactions
   */
  static getTransactions = () => {
    return ipcMain.on(
      Channel.GetTransactions,
      (
        e: Electron.Event,
        { pageNo, pageSize, addresses }: { pageNo: number; pageSize: number; addresses: string[] },
      ) => {
        e.sender.send(Channel.GetTransactions, {
          status: ResponseCode.Success,
          result: {
            addresses,
            pageNo,
            pageSize,
            totalCount: transactionCount,
            items: transactions.map(tx => ({
              ...tx,
              value: tx.value * pageNo * pageSize,
            })),
          },
        })
      },
    )
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

  // controller style code
  public static networks = () => {
    return ipcMain.on(Channel.Networks, (e: Electron.Event, method: keyof typeof NetworksController, params: any) => {
      e.sender.send(Channel.Networks, method, (NetworksController[method] as Function)(params))
    })
  }

  public static transactions = () => {
    return ipcMain.on(
      Channel.Transactions,
      (e: Electron.Event, method: keyof typeof TransactionsController, params: any) => {
        e.sender.send(Channel.Transactions, method, (TransactionsController[method] as Function)(params))
      },
    )
  }

  // TODO: add wallet controller and service
  // public wallet = () => {
  //   return ipcMain.on(
  //     Channel.Wallet,
  //     (e: Electron.Event, { method, params }: { method: keyof typeof NetworksController; params: any }) => {
  //       e.sender.send(Channel.Networks, (NetworksController[method] as Function)(params))
  //     },
  //   )
  // }
}

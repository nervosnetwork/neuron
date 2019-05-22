import { ipcMain } from 'electron'
import { Channel } from '../utils/const'
import NetworksController from '../controllers/networks'
import TransactionsController from '../controllers/transactions'
import WalletsController from '../controllers/wallets'
import HelpersController from '../controllers/helpers'

export default class Listeners {
  static start = (methods: string[] = ['networks', 'wallets', 'transactions', 'helpers']) => {
    methods.forEach(method => {
      const descriptor = Object.getOwnPropertyDescriptor(Listeners, method)
      if (descriptor) {
        descriptor.value()
      }
    })
  }

  /**
   * @method networks
   * @memberof ChannelListeners
   * @description listen to Channel.Networks and invoke corresponding method of networksController
   */
  public static networks = () => {
    return ipcMain.on(
      Channel.Networks,
      async (e: Electron.Event, method: keyof typeof NetworksController, ...params: any[]) => {
        e.sender.send(Channel.Networks, method, await (NetworksController[method] as Function)(...params))
      },
    )
  }

  /**
   * @method transactions
   * @memberof ChannelListeners
   * @description listen to Channel.Transactions and invoke corresponding method of transactionsController
   */
  public static transactions = () => {
    return ipcMain.on(
      Channel.Transactions,
      async (e: Electron.Event, method: keyof typeof TransactionsController, ...params: any[]) => {
        e.sender.send(Channel.Transactions, method, await (TransactionsController[method] as Function)(...params))
      },
    )
  }

  /**
   * @method wallet
   * @memberof ChannelListeners
   * @description listen to Channel.Wallet and invoke corresponding method of WalletsController
   */
  public static wallets = () => {
    return ipcMain.on(
      Channel.Wallets,
      async (e: Electron.Event, method: keyof typeof WalletsController, ...params: any[]) => {
        e.sender.send(Channel.Wallets, method, await (WalletsController[method] as Function)(...params))
      },
    )
  }

  /**
   * @method helpers
   * @memberof ChannelListeners
   * @description provide helper methods to UI layer
   */
  public static helpers = () => {
    return ipcMain.on(
      Channel.Helpers,
      (e: Electron.Event, method: keyof typeof HelpersController, ...params: any[]) => {
        e.sender.send(Channel.Helpers, method, (HelpersController[method] as Function)(...params))
      },
    )
  }
}

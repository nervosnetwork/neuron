import { dialog, shell, Menu, MessageBoxOptions, SaveDialogOptions, BrowserWindow } from 'electron'
import app from '../../app'
import { URL, contextMenuTemplate } from './options'

import TransactionsController from '../transactions'
import NetworksService from '../../services/networks'
import WalletsService from '../../services/wallets'
import WalletsController from '../wallets'

import { Controller as ControllerDecorator } from '../../decorators'
import { Channel, ResponseCode } from '../../utils/const'
import windowManage from '../../utils/window-manage'
import i18n from '../../utils/i18n'

const walletsService = WalletsService.getInstance()
const networksService = NetworksService.getInstance()

@ControllerDecorator(Channel.App)
export default class AppController {
  public static initWindow = async (win: BrowserWindow) => {
    const [activeWallet, wallets, activeNetworkId, networks, transactions] = await Promise.all([
      walletsService.getCurrent(),
      walletsService.getAll(),
      networksService.activeId(),
      networksService.getAll(),
      TransactionsController.getAllByAddresses({
        pageNo: 1,
        pageSize: 15,
        addresses: [],
      }).then(res => res.result),
    ])

    const locale = app.getLocale()
    const initState = {
      activeWallet: activeWallet && {
        ...activeWallet,
      },
      balance: '1000000000000001212121212', // TODO: provide the balance of current wallet
      wallets: [...wallets.map(({ name, id }) => ({ id, name }))],
      activeNetworkId,
      networks,
      transactions,
      locale,
    }
    win.webContents.send(Channel.Initiate, { status: ResponseCode.Success, result: initState })
  }

  public static showMessageBox(
    options: MessageBoxOptions,
    callback?: (response: number, checkboxChecked: boolean) => void
  ) {
    dialog.showMessageBox(options, callback)
  }

  public static showSaveDialog(options: SaveDialogOptions, callback?: (filename?: string, bookmark?: string) => void) {
    dialog.showSaveDialog(options, callback)
  }

  public static toggleAddressBook() {
    windowManage.broadcast(Channel.App, 'toggleAddressBook', {
      status: ResponseCode.Success,
    })
  }

  public static navTo(path: string) {
    windowManage.sendToFocusedWindow(Channel.App, 'navTo', {
      status: ResponseCode.Success,
      result: path,
    })
  }

  public static setUILocale(locale: string) {
    windowManage.broadcast(Channel.App, 'setUILocale', {
      status: ResponseCode.Success,
      result: locale,
    })
  }

  public static openExternal(url: string) {
    shell.openExternal(url)
  }

  public static async contextMenu(params: { type: string; id: string }) {
    if (!params || params.id === undefined) return
    const { id, type } = params
    switch (type) {
      case 'networkList':
      case 'walletList':
      case 'addressList':
      case 'transactionList': {
        const menu = Menu.buildFromTemplate(await contextMenuTemplate[type](id))
        menu.popup()
        break
      }
      default: {
        break
      }
    }
  }

  public static showAbout() {
    const options = {
      type: 'info',
      title: app.getName(),
      message: app.getName(),
      detail: app.getVersion(),
      buttons: ['OK'],
      cancelId: 0,
    }
    AppController.showMessageBox(options)
  }

  public static openWebsite() {
    AppController.openExternal(URL.Website)
  }

  public static openRepository() {
    AppController.openExternal(URL.Repository)
  }

  public static showPreference() {
    AppController.navTo(URL.Preference)
  }

  public static createWallet() {
    AppController.navTo(URL.CreateWallet)
  }

  public static importWallet() {
    AppController.navTo(URL.ImportWallet)
  }

  public static async backupCurrentWallet() {
    const currentWallet = AppController.getCurrentWallet()
    if (currentWallet) {
      const res = await WalletsController.backup(currentWallet.id)
      if (!res.status) {
        AppController.showMessageBox({
          type: 'error',
          message: res.msg!,
        })
      }
    }
  }

  public static async deleteCurrentWallet() {
    const currentWallet = AppController.getCurrentWallet()
    if (currentWallet) {
      const res = await WalletsController.delete(currentWallet.id)
      if (!res.status) {
        AppController.showMessageBox({
          type: 'error',
          message: res.msg!,
        })
      }
    }
  }

  private static getCurrentWallet() {
    const currentWallet = walletsService.getCurrent()
    if (!currentWallet) {
      AppController.showMessageBox({
        type: 'error',
        message: i18n.t('messages.not-found', { field: i18n.t('keywords.wallet') }),
      })
      return null
    }
    return currentWallet
  }
}

/* eslint-disable */
declare global {
  module Controller {
    type AppMethod = Exclude<keyof typeof AppController, keyof typeof Object>
  }
}
/* eslint-enable */

import path from 'path'
import { dialog, shell, Menu, MessageBoxOptions, SaveDialogOptions, BrowserWindow } from 'electron'
import app from '../../app'
import { URL, contextMenuTemplate } from './options'

import TransactionsController from '../transactions'
import WalletsService from '../../services/wallets'
import WalletsController from '../wallets'

import { Controller as ControllerDecorator } from '../../decorators'
import { Channel, ResponseCode } from '../../utils/const'
import WindowManager from '../../models/window-manager'
import i18n from '../../utils/i18n'
import env from '../../env'
import CommandSubject from '../../models/subjects/command'

@ControllerDecorator(Channel.App)
export default class AppController {
  public static getInitState = async () => {
    const walletsService = WalletsService.getInstance()
    const [currentWallet = null, wallets = []] = await Promise.all([
      walletsService.getCurrent(),
      walletsService.getAll(),
    ])
    const addresses: Controller.Address[] = await (currentWallet
      ? WalletsController.getAllAddresses(currentWallet.id).then(res => res.result)
      : [])

    const transactions = currentWallet
      ? await TransactionsController.getAllByKeywords({
          pageNo: 1,
          pageSize: 15,
          keywords: '',
          walletID: currentWallet.id,
        }).then(res => res.result)
      : []
    const locale = app.getLocale()
    const initState = {
      currentWallet: currentWallet && {
        ...currentWallet,
      },
      wallets: [...wallets.map(({ name, id }) => ({ id, name }))],
      addresses,
      transactions,
      locale,
    }
    return { status: ResponseCode.Success, result: initState }
  }

  public static handleViewError = (error: string) => {
    if (env.isDevMode) {
      console.error(error)
    }
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
    if (WindowManager.mainWindow) {
      CommandSubject.next({
        winID: WindowManager.mainWindow.id,
        type: 'toggleAddressBook',
        payload: null,
      })
    }
  }

  public static navTo(url: string) {
    if (WindowManager.mainWindow) {
      CommandSubject.next({ winID: WindowManager.mainWindow.id, type: 'nav', payload: url })
    }
  }

  public static openExternal(url: string) {
    shell.openExternal(url)
  }

  public static async contextMenu(params: { type: string; id: string }) {
    if (!params || params.id === undefined) {
      return
    }
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

  public static async showTransactionDetails(hash: string) {
    const win = new BrowserWindow({
      width: 1200,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../../startup/preload.js'),
      },
    })
    win.loadURL(`${env.mainURL}#/transaction/${hash}`)
    win.on('ready-to-show', () => {
      win.setTitle(i18n.t(`messageBox.transaction.title`, { hash }))
      win.show()
      win.focus()
    })
  }
}

/* eslint-disable */
declare global {
  module Controller {
    type AppMethod = Exclude<keyof typeof AppController, keyof typeof Object>
  }
}
/* eslint-enable */

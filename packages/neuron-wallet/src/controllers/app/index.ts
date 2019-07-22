import path from 'path'
import { dialog, shell, Menu, MessageBoxOptions, SaveDialogOptions, BrowserWindow } from 'electron'
import { take } from 'rxjs/operators'
import systemScriptSubject from '../../models/subjects/system-script'
import app from '../../app'
import { URL, contextMenuTemplate } from './options'

import TransactionsController from '../transactions'
import NetworksService from '../../services/networks'
import WalletsService from '../../services/wallets'
import NodeService from '../../services/node'
import WalletsController from '../wallets'
import SyncInfoController from '../sync-info'

import { Controller as ControllerDecorator } from '../../decorators'
import { Channel, ResponseCode } from '../../utils/const'
import WindowManager from '../../models/window-manager'
import i18n from '../../utils/i18n'
import env from '../../env'

const networksService = NetworksService.getInstance()
const nodeService = NodeService.getInstance()

@ControllerDecorator(Channel.App)
export default class AppController {
  public static initWindow = async (win: BrowserWindow) => {
    const walletsService = WalletsService.getInstance()
    const [
      currentWallet = null,
      wallets = [],
      currentNetworkID = '',
      networks = [],
      tipNumber = '0',
      connectStatus = false,
      codeHash = '',
    ] = await Promise.all([
      walletsService.getCurrent(),
      walletsService.getAll(),
      networksService.getCurrentID(),
      networksService.getAll(),
      SyncInfoController.currentBlockNumber()
        .then(res => {
          if (res.status) {
            return res.result.currentBlockNumber
          }
          return '0'
        })
        .catch(() => '0'),
      new Promise(resolve => {
        nodeService.connectStatusSubject.pipe(take(1)).subscribe(
          status => {
            resolve(status)
          },
          () => {
            resolve(false)
          }
        )
      }),
      new Promise(resolve => {
        systemScriptSubject.pipe(take(1)).subscribe(({ codeHash: currentCodeHash }) => resolve(currentCodeHash))
      }),
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
      currentNetworkID,
      networks,
      transactions,
      locale,
      tipNumber,
      connectStatus,
      codeHash,
    }
    win.webContents.send(Channel.Initiate, { status: ResponseCode.Success, result: initState })
  }

  public static handleViewError = (error: string) => {
    if (env.isDevMode) {
      console.error(error)
    }
    setTimeout(() => {
      if (WindowManager.mainWindow) {
        AppController.initWindow(WindowManager.mainWindow)
      }
    }, 500)
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
    WindowManager.broadcast(Channel.App, 'toggleAddressBook', {
      status: ResponseCode.Success,
    })
  }

  public static navTo(url: string) {
    WindowManager.sendToMainWindow(Channel.App, 'navTo', {
      status: ResponseCode.Success,
      result: url,
    })
  }

  public static setUILocale(locale: string) {
    WindowManager.broadcast(Channel.App, 'setUILocale', {
      status: ResponseCode.Success,
      result: locale,
    })
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
      AppController.initWindow(win)
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

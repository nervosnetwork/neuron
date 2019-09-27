import path from 'path'
import {
  dialog,
  shell,
  Menu,
  MenuItem,
  MessageBoxOptions,
  MessageBoxReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
  BrowserWindow,
} from 'electron'
import { take } from 'rxjs/operators'
import app from 'app'

import TransactionsController from 'controllers/transactions'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import WalletsController from 'controllers/wallets'
import SyncInfoController from 'controllers/sync-info'
import UpdateController from 'controllers/update'

import { ResponseCode } from 'utils/const'
import WindowManager from 'models/window-manager'
import i18n from 'utils/i18n'
import env from 'env'
import CommandSubject from 'models/subjects/command'
import { ConnectionStatusSubject } from 'models/subjects/node'
import { SystemScriptSubject } from 'models/subjects/system-script'

import { URL, contextMenuTemplate } from './options'

export default class AppController {
  public static getInitState = async () => {
    const walletsService = WalletsService.getInstance()
    const networksService = NetworksService.getInstance()
    const [
      currentWallet = null,
      wallets = [],
      currentNetworkID = '',
      networks = [],
      syncedBlockNumber = '0',
      connectionStatus = false,
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
        ConnectionStatusSubject.pipe(take(1)).subscribe(
          status => {
            resolve(status)
          },
          () => {
            resolve(false)
          }
        )
      }),
      new Promise(resolve => {
        SystemScriptSubject.pipe(take(1)).subscribe(({ codeHash: currentCodeHash }) => resolve(currentCodeHash))
      }),
    ])

    const minerAddresses = await Promise.all(
      wallets.map(({ id }) =>
        WalletsController.getAllAddresses(id).then(addrRes => {
          if (addrRes.result) {
            const minerAddr = addrRes.result.find(addr => addr.type === 0 && addr.index === 0)
            if (minerAddr) {
              return {
                address: minerAddr.address,
                identifier: minerAddr.identifier,
              }
            }
          }
          return undefined
        })
      )
    )
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
    const initState = {
      currentWallet,
      wallets: [...wallets.map(({ name, id }, idx: number) => ({ id, name, minerAddress: minerAddresses[idx] }))],
      currentNetworkID,
      networks,
      addresses,
      transactions,
      syncedBlockNumber,
      connectionStatus,
      codeHash,
    }

    return { status: ResponseCode.Success, result: initState }
  }

  public static handleViewError = (error: string) => {
    if (env.isDevMode) {
      console.error(error)
    }
  }

  public static isMainWindow = (winID: number) => {
    return WindowManager.mainWindow && winID === WindowManager.mainWindow.id
  }

  public static showMessageBox(options: MessageBoxOptions, callback?: (returnValue: MessageBoxReturnValue) => void) {
    dialog.showMessageBox(options).then(callback)
  }

  public static showSaveDialog(options: SaveDialogOptions, callback?: (returnValue: SaveDialogReturnValue) => void) {
    dialog.showSaveDialog(options).then(callback)
  }

  public static toggleAddressBook() {
    if (WindowManager.mainWindow) {
      CommandSubject.next({
        winID: WindowManager.mainWindow.id,
        type: 'toggle-address-book',
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

  public static checkUpdates(menuItem: MenuItem) {
    new UpdateController().checkUpdates(menuItem)
  }

  public static showPreference() {
    AppController.navTo(URL.Preference)
  }

  public static createWallet() {
    AppController.navTo(URL.CreateWallet)
  }

  public static importWallet(type: 'mnemonic' | 'keystore') {
    if (type === 'mnemonic') {
      AppController.navTo(URL.ImportMnemonic)
    } else if (type === 'keystore') {
      AppController.navTo(URL.ImportKeystore)
    }
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

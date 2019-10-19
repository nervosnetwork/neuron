import path from 'path'
import { app as electronApp, remote, shell, MenuItem, dialog, BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'
import { take } from 'rxjs/operators'

import env from 'env'
import { updateApplicationMenu, popContextMenu } from './menu'
import { TransactionsController, WalletsController, SyncInfoController, UpdateController } from 'controllers'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import SkipDataAndType from 'services/settings/skip-data-and-type'
import { ResponseCode } from 'utils/const'
import logger from 'utils/logger'
import i18n from 'utils/i18n'
import CommandSubject from 'models/subjects/command'
import { ConnectionStatusSubject } from 'models/subjects/node'
import { SystemScriptSubject } from 'models/subjects/system-script'
import { subscribe } from './subscribe'

enum URL {
  Preference = '/settings/general',
  CreateWallet = '/wizard/mnemonic/create',
  ImportMnemonic = '/wizard/mnemonic/import',
  ImportKeystore = '/keystore/import',
}

// Acts as a middle man so that subscribe doesn't have to know AppController
const eventResponder = {
  sendMessage: (channel: string, arg: any) => {
    AppController.sendMessage(channel, arg)
  },

  updateMenu: () => {
    AppController.updateApplicationMenu()
  }
}
subscribe(eventResponder)

const app = electronApp || (remote && remote.app)

export default class AppController {
  public static mainWindow: BrowserWindow | null

  public static sendMessage = (channel: string, obj: any) => {
    if (AppController.mainWindow) {
      AppController.mainWindow.webContents.send(channel, obj)
    }
  }

  public static openWindow = () => {
    if (AppController.mainWindow) {
      return
    }

    AppController.createWindow()
  }

  static createWindow = () => {
    const windowState = windowStateKeeper({
      defaultWidth: 1366,
      defaultHeight: 768,
    })

    const mainWindow = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      minWidth: 800,
      minHeight: 600,
      show: false,
      backgroundColor: '#e9ecef',
      icon: path.join(__dirname, '../../neuron-ui/icon.png'),
      webPreferences: {
        devTools: env.isDevMode,
        nodeIntegration: env.isDevMode || env.isTestMode,
        preload: path.join(__dirname, './preload.js'),
      },
    })

    windowState.manage(mainWindow)

    mainWindow.on('ready-to-show', () => {
      if (AppController.mainWindow) {
        AppController.mainWindow.show()
        AppController.mainWindow.focus()
        logger.info('The main window is ready to show')
      } else {
        logger.error('The main window is not initialized on ready to show')
      }
    })

    mainWindow.on('closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
      if (AppController.mainWindow) {
        AppController.mainWindow.removeAllListeners()
        AppController.mainWindow = null
      }
    })

    mainWindow.on('focus', () => {
      AppController.updateApplicationMenu()
    })

    mainWindow.on('blur', () => {
      AppController.updateApplicationMenu()
    })

    mainWindow.loadURL(env.mainURL)
    AppController.mainWindow = mainWindow
    AppController.updateApplicationMenu()
  }

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
          },
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
        }),
      ),
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

    const skipDataAndType = SkipDataAndType.getInstance().get()

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
      skipDataAndType,
    }

    return { status: ResponseCode.Success, result: initState }
  }

  public static handleViewError = (error: string) => {
    if (env.isDevMode) {
      console.error(error)
    }
  }

  public static isMainWindow = (winID: number) => {
    return AppController.mainWindow && winID === AppController.mainWindow.id
  }

  public static updateApplicationMenu = () => {
    updateApplicationMenu()
  }

  public static async contextMenu(params: { type: string; id: string }) {
    return popContextMenu(params)
  }

  public static toggleAddressBook() {
    if (AppController.mainWindow) {
      CommandSubject.next({
        winID: AppController.mainWindow.id,
        type: 'toggle-address-book',
        payload: null,
      })
    }
  }

  public static navTo(url: string) {
    if (AppController.mainWindow) {
      CommandSubject.next({ winID: AppController.mainWindow.id, type: 'nav', payload: url })
    }
  }

  public static openExternal(url: string) {
    shell.openExternal(url)
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
    dialog.showMessageBox(options)
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
        preload: path.join(__dirname, './preload.js'),
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

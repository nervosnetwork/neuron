import path from 'path'
import { app, BrowserWindow, Menu } from 'electron'
import windowStateKeeper from 'electron-window-state'
import 'reflect-metadata'

import env from './env'
import WalletChannel from './channel/wallet'
import TerminalChannel from './channel/terminal'
import monitorChain from './monitor'
import i18n from './i18n'
import mainmenu from './menu'
import dispatch, { Command } from './commands/dispatcher'
import NetworksController from './controllers/networks'
import WindowManage from './utils/windowManage'
import WalletsController from './controllers/wallets'

import initConnection from './typeorm'

const windowManage = new WindowManage()

let mainWindow: Electron.BrowserWindow | null
WalletChannel.start()

const initUILayer = async (win: BrowserWindow) => {
  const channel = new WalletChannel(win)

  dispatch(Command.SyncWallets, {
    channel,
    extra: {
      activeOne: WalletsController.getActive(),
      wallets: WalletsController.getAll(),
    },
  })

  dispatch(Command.SyncNetworks, {
    channel,
    extra: {
      active: await NetworksController.activeOne(),
      networks: await NetworksController.getAll(),
      connected: {
        status: 1,
        result: 1,
      },
    },
  })

  dispatch(Command.SetUILocale, {
    channel,
    extra: { locale: app.getLocale() },
  })
}

function createWindow() {
  const windowState = windowStateKeeper({
    defaultWidth: 1366,
    defaultHeight: 768,
  })

  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      devTools: env.isDevMode,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  windowState.manage(mainWindow)

  i18n.changeLanguage(app.getLocale())
  Menu.setApplicationMenu(mainmenu())

  const url = WalletsController.getActive().status ? env.mainURL : `${env.mainURL}/wallets/wizard`
  mainWindow.loadURL(url)

  mainWindow.on('close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      windowManage.remove(mainWindow.id)
    }
  })

  mainWindow.on('closed', () => {
    if (mainWindow) {
      mainWindow = null
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    mainWindow!.focus()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    /**
     * @initUILayer
     * @desc send current wallet to UILayer
     */
    initUILayer(mainWindow!)
  })
  /**
   * @monitorChain
   * @description monitor network
   */
  monitorChain(mainWindow.webContents)
  const terminalChannel = new TerminalChannel(mainWindow.webContents)
  terminalChannel.start()

  windowManage.add(mainWindow)
}

const onReady = () => {
  createWindow()
  // sync database
  initConnection().then()
}

app.on('ready', onReady)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

export default windowManage

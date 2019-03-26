import { app, BrowserWindow, Menu } from 'electron'
import windowStateKeeper from 'electron-window-state'
import path from 'path'

import env from './env'
import WalletChannel from './channel/wallet'
import TerminalChannel from './channel/terminal'
import monitorChain from './monitor'
import i18n from './i18n'
import mainmenu from './menu'
import dispatch, { Command } from './commands/dispatcher'
import NetowrksController from './controllers/netowrks'
import WindowManage from './utils/windowManage'

const windowManage = new WindowManage()

let mainWindow: Electron.BrowserWindow | null
// start listening
WalletChannel.start()

const initUILayer = (win: BrowserWindow) => {
  const channel = new WalletChannel(win)
  // const netowrksController = new NetowrksController(channel)

  dispatch(Command.SendWallet, {
    channel,
  })

  dispatch(Command.SyncNetworks, {
    channel,
    extra: {
      active: NetowrksController.activeNetwork(),
      networks: NetowrksController.index(),
      connected: {
        status: 1,
        result: 1,
      },
    },
  })

  dispatch(Command.SetUILocale, {
    channel,
    extra: {
      locale: app.getLocale(),
    },
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

  mainWindow.loadURL(env.mainURL)

  mainWindow.on('closed', () => {
    mainWindow = null
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

app.on('ready', createWindow)

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

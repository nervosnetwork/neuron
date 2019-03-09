import { app, BrowserWindow, Menu } from 'electron'
import windowStateKeeper from 'electron-window-state'
import path from 'path'
import env from './env'
import listenToChannel, { sendTransactionHistory } from './channel'
import monitorChain from './monitor'
import i18n from './i18n'
import mainmenu from './menu'
import asw from './wallets/asw'
import dispatch, { Command } from './commands/dispatcher'
import TerminalChannel from './channel/terminal'

let mainWindow: Electron.BrowserWindow | null

const initUILayer = (win: BrowserWindow) => {
  win.webContents.send('ASW', {
    status: 1,
    result: {
      name: 'asw',
      address: asw.address,
      publicKey: asw.publicKey,
    },
  })

  dispatch(Command.SetUILocale, {
    window: win,
    extra: {
      locale: app.getLocale(),
    },
  })
  sendTransactionHistory(win, 0, 15)
}

listenToChannel()

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
  BrowserWindow.addDevToolsExtension(
    '/Users/ChenYu/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/3.6.0_0',
  )
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

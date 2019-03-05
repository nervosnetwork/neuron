import { app, BrowserWindow, Menu } from 'electron'
import windowStateKeeper from 'electron-window-state'
import path from 'path'
import env from './env'
import listenToChannel, { setLanguage, sendTransactionHistory } from './channel'
import monitorChain from './monitor'
import menu from './menu'
import asw from './wallets/asw'

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
  setLanguage(win, app.getLocale())
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

  Menu.setApplicationMenu(menu)

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

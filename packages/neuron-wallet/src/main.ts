import { app, BrowserWindow, Menu } from 'electron'
import windowStateKeeper from 'electron-window-state'
import * as path from 'path'
import listenToChannel from './IPCChannel'
import menu from './menu'

let mainWindow: Electron.BrowserWindow | null

const { NODE_ENV } = process.env

const ENTRY = {
  DEV: 'http://localhost:3000',
  PROD: `file://${path.join(__dirname, '../../neuron-ui/build/index.html')}`,
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
      devTools: NODE_ENV === 'development',
    },
  })

  windowState.manage(mainWindow)

  Menu.setApplicationMenu(menu)

  mainWindow.loadURL(NODE_ENV === 'development' ? ENTRY.DEV : ENTRY.PROD)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    mainWindow!.focus()
  })
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

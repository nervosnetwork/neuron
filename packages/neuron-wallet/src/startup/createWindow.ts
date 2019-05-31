import { BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'
import path from 'path'
import env from '../env'
import AppController from '../controllers/app'

function createWindow() {
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
    webPreferences: {
      devTools: env.isDevMode,
      nodeIntegration: false,
      preload: path.join(__dirname, './preload.js'),
    },
  })

  windowState.manage(mainWindow)

  mainWindow.loadURL(env.mainURL)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
    AppController.initWindow(mainWindow!)
  })

  return mainWindow
}

export default createWindow

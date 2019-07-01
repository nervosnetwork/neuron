import { BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'
import path from 'path'
import env from '../env'
import AppController from '../controllers/app'
import logger from '../utils/logger'

function createWindow() {
  const windowState = windowStateKeeper({
    defaultWidth: 1366,
    defaultHeight: 768,
  })

  global.mainWindow = new BrowserWindow({
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

  windowState.manage(global.mainWindow)

  global.mainWindow.loadURL(env.mainURL)

  global.mainWindow.on('ready-to-show', () => {
    if (global.mainWindow) {
      global.mainWindow.show()
      global.mainWindow.focus()
      AppController.initWindow(global.mainWindow!)
    } else {
      logger.log({
        level: 'error',
        message: 'The main window is not initialized on ready to show',
      })
    }
  })

  return global.mainWindow
}

export default createWindow

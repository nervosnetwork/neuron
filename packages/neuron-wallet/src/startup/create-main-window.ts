import { BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'
import path from 'path'
import WindowManager from 'models/window-manager'
import env from 'env'
import logger from 'utils/logger'

function createWindow() {
  const windowState = windowStateKeeper({
    defaultWidth: 1366,
    defaultHeight: 768,
  })

  WindowManager.mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#e9ecef',
    icon: path.join(__dirname, '../neuron-ui/icon.png'),
    webPreferences: {
      devTools: env.isDevMode,
      nodeIntegration: env.isDevMode || env.isTestMode,
      preload: path.join(__dirname, './preload.js'),
    },
  })

  windowState.manage(WindowManager.mainWindow)

  WindowManager.mainWindow.loadURL(env.mainURL)

  WindowManager.mainWindow.on('ready-to-show', () => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.show()
      WindowManager.mainWindow.focus()
      logger.info('The main window is ready to show')
    } else {
      logger.error('The main window is not initialized on ready to show')
    }
  })

  return WindowManager.mainWindow
}

export default createWindow

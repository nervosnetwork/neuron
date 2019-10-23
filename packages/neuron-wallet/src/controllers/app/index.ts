import path from 'path'
import { app as electronApp, remote, BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'

import env from 'env'
import { updateApplicationMenu } from './menu'
import logger from 'utils/logger'
import { subscribe } from './subscribe'

const app = electronApp || (remote && remote.app)

export default class AppController {
  public mainWindow: BrowserWindow | null

  constructor() {
    this.mainWindow = null
    subscribe(this)
  }

  public sendMessage = (channel: string, obj: any) => {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, obj)
    }
  }

  public updateMenu = () => {
    updateApplicationMenu(this.mainWindow)
  }

  public openWindow = () => {
    if (this.mainWindow) {
      return
    }

    this.createWindow()
  }

  createWindow = () => {
    const windowState = windowStateKeeper({
      defaultWidth: 1366,
      defaultHeight: 768,
    })

    this.mainWindow = new BrowserWindow({
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

    windowState.manage(this.mainWindow)

    this.mainWindow.on('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show()
        this.mainWindow.focus()
        logger.info('The main window is ready to show')
      } else {
        logger.error('The main window is not initialized on ready to show')
      }
    })

    this.mainWindow.on('closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
      if (this.mainWindow) {
        this.mainWindow.removeAllListeners()
        this.mainWindow = null
      }
    })

    this.mainWindow.on('focus', () => {
      this.updateMenu()
    })

    this.mainWindow.on('blur', () => {
      this.updateMenu()
    })

    this.mainWindow.loadURL(env.mainURL)
    this.updateMenu()
  }
}

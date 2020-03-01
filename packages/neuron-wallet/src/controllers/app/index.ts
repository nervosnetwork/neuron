import path from 'path'
import { app as electronApp, remote, BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'

import env from 'env'
import { updateApplicationMenu } from './menu'
import logger from 'utils/logger'
import { subscribe } from './subscribe'
import { register as registerListeners } from 'listeners/main'
import WalletsService from 'services/wallets'
import ApiController from 'controllers/api'
import NodeController from 'controllers/node'
import SyncApiController from 'controllers/sync-api'

const app = electronApp || (remote && remote.app)

export default class AppController {
  public mainWindow: BrowserWindow | null = null
  private apiController = new ApiController()
  private syncApiController = new SyncApiController()

  constructor() {
    subscribe(this)
  }

  public start = async () => {
    if (!env.isTestMode) {
      await new NodeController().startNode()
    }

    registerListeners()

    WalletsService.getInstance().generateAddressesIfNecessary()

    this.apiController.mount()
    this.syncApiController.mount()
    this.openWindow()
  }

  public end = () => {
    if (!env.isTestMode) {
      new NodeController().stopNode()
    }
  }

  public sendMessage = (channel: string, obj: any) => {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, obj)
    }
  }

  public runCommand = (command: string, obj: any) => {
    this.apiController.runCommand(command, obj)
  }

  public updateMenu = () => {
    updateApplicationMenu(this.mainWindow)
  }

  public updateWindowTitle = () => {
    const currentWallet = WalletsService.getInstance().getCurrent()
    const title = currentWallet ? `${currentWallet.name} - Neuron` : 'Neuron'
    this.mainWindow?.setTitle(title)
  }

  public openWindow = () => {
    if (this.mainWindow) {
      return
    }

    this.createWindow()
  }

  public restoreWindow = () => {
    if (!this.mainWindow) {
      return
    }

    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore()
    }
    this.mainWindow.focus()
  }

  createWindow = () => {
    const windowState = windowStateKeeper({
      defaultWidth: 1366,
      defaultHeight: 900,
    })

    this.mainWindow = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      minWidth: 900,
      minHeight: 600,
      show: false,
      backgroundColor: '#e9ecef',
      icon: path.join(__dirname, '../../neuron-ui/icon.png'),
      webPreferences: {
        devTools: env.isDevMode,
        nodeIntegration: false,
        preload: path.join(__dirname, './preload.js'),
      },
    })

    windowState.manage(this.mainWindow)

    this.mainWindow.on('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show()
        this.mainWindow.focus()
        this.updateWindowTitle()
        logger.info('Main window:\tThe main window is ready to show')
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

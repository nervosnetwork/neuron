import path from 'path'
import { t } from 'i18next'
import { app as electronApp, BrowserWindow, nativeImage } from 'electron'
import windowStateKeeper from 'electron-window-state'

import env from '../../env'
import { updateApplicationMenu } from './menu'
import logger from '../../utils/logger'
import { subscribe } from './subscribe'
import { register as registerListeners } from '../../listeners/main'
import WalletsService from '../../services/wallets'
import ApiController, { Command } from '../../controllers/api'
import { migrate as mecuryMigrate } from '../../controllers/mercury'
import SyncApiController from '../../controllers/sync-api'
import { SETTINGS_WINDOW_TITLE } from '../../utils/const'
import { stopCkbNode } from '../../services/ckb-runner'
import { CKBLightRunner } from '../../services/light-runner'

const app = electronApp

export default class AppController {
  public mainWindow: BrowserWindow | null = null
  private apiController = new ApiController()
  private windowRegisterChannels = new WeakMap<BrowserWindow, string[]>()
  private static instance: AppController

  private constructor() {
    subscribe(this)
  }

  static getInstance() {
    if (AppController.instance) {
      return AppController.instance
    }
    AppController.instance = new AppController()
    return AppController.instance
  }

  public start = async () => {
    registerListeners()

    if (!env.isTestMode) {
      await mecuryMigrate()
    }

    /**
     * mount event handlers to renderer ipc messages and user actions
     */
    await this.apiController.mount()
    SyncApiController.getInstance().mount()

    await this.openWindow()
  }

  /**
   * called before the app quits
   */
  public end = async () => {
    if (env.isTestMode) {
      return
    }
    await Promise.all([stopCkbNode(), CKBLightRunner.getInstance().stop()])
  }

  public registerChannels(win: BrowserWindow, channels: string[]) {
    this.windowRegisterChannels.set(win, channels)
  }

  /**
   * send message to renderer process
   */
  public sendMessage = (channel: string, obj: any) => {
    this.mainWindow?.webContents.send(channel, obj)
    BrowserWindow.getAllWindows().forEach(window => {
      const channels = this.windowRegisterChannels.get(window)
      if (channels && channels.includes(channel)) {
        window.webContents.send(channel, obj)
      }
    })
  }

  /**
   * run command with user action
   */
  public runCommand = (command: Command, obj: any) => {
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

    return this.createWindow()
  }

  public restoreWindow = () => {
    if (!this.mainWindow) {
      return
    }
    this.mainWindow.isMinimized() ? this.mainWindow.restore() : this.mainWindow.focus()
  }

  public createWindow = () => {
    const MIN_WIDTH = 1200
    const windowState = windowStateKeeper({ defaultWidth: 1366, defaultHeight: 900 })

    this.mainWindow = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: Math.max(windowState.width, MIN_WIDTH),
      height: windowState.height,
      minWidth: MIN_WIDTH,
      minHeight: 600,
      show: false,
      backgroundColor: '#e9ecef',
      icon: nativeImage.createFromPath(
        path.join(__dirname, app.isPackaged ? '../../neuron-ui/icon.png' : '../../../assets/icons/icon.png')
      ),
      webPreferences: {
        nodeIntegration: true,
        devTools: env.isDevMode,
        contextIsolation: false,
        preload: path.join(__dirname, './preload.js'),
      },
    })

    windowState.manage(this.mainWindow)

    this.mainWindow.on('ready-to-show', () => {
      if (!this.mainWindow) {
        logger.error('Main window:\tfailed to open window due to mainWindow is undefined')
        return
      }
      this.mainWindow.show()
      this.mainWindow.focus()
      this.updateWindowTitle()
    })

    this.mainWindow.on('closed', () => {
      this.clearOnClosed()
    })

    this.mainWindow.on('focus', () => {
      this.updateMenu()
    })

    this.mainWindow.on('blur', () => {
      this.updateMenu()
    })

    this.mainWindow.loadURL(env.mainURL)
    this.updateMenu()

    return new Promise<void>(resolve => {
      this.mainWindow?.on('show', () => resolve())
    })
  }

  private clearOnClosed = () => {
    const windowsToClose = [t(SETTINGS_WINDOW_TITLE)]
    BrowserWindow.getAllWindows().forEach(bw => {
      if (windowsToClose.includes(bw.getTitle())) {
        bw.close()
      }
    })

    if (this.mainWindow) {
      this.mainWindow.removeAllListeners()
      this.mainWindow = null
    }
  }
}

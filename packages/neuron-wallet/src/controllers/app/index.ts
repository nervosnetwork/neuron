import path from 'path'
import { t } from 'i18next'
import { app as electronApp, remote, BrowserWindow, nativeImage } from 'electron'
import windowStateKeeper from 'electron-window-state'

import env from 'env'
import { updateApplicationMenu } from './menu'
import logger from 'utils/logger'
import { subscribe } from './subscribe'
import { register as registerListeners } from 'listeners/main'
import WalletsService from 'services/wallets'
import ApiController from 'controllers/api'
import NodeController from 'controllers/node'
import MerucuryController from 'controllers/mercury'
import SyncApiController from 'controllers/sync-api'
import { SETTINGS_WINDOW_TITLE } from 'utils/const'
import IndexerService from 'services/indexer'

const app = electronApp || (remote && remote.app)

export default class AppController {
  public mainWindow: BrowserWindow | null = null
  private syncApiController: SyncApiController | undefined
  private apiController = new ApiController()
  private mercuryController = new MerucuryController()

  constructor() {
    subscribe(this);
  }

  public start = async () => {
    registerListeners()
    if (!env.isTestMode) {
      await this.mercuryController.migrate()
    }
    await this.apiController.mount()
    this.syncApiController = SyncApiController.getInstance()
    this.syncApiController.mount()
    await this.openWindow()
  }

  public end = async () => {
    if (!env.isTestMode) {
      await Promise.all([
        new NodeController().stopNode(),
        IndexerService.getInstance().stop(),
      ])
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

    return this.createWindow()
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
      icon: nativeImage.createFromPath(
        app.isPackaged
          ? path.join(__dirname, '../../neuron-ui/icon.png')
          // use icon from assets in dev mode
          // since neuron ui only copied to dist during packaging
          : path.join(__dirname, '../../../assets/icons/icon.png')
      ),
      webPreferences: {
        devTools: env.isDevMode,
        nodeIntegration: false,
        enableRemoteModule: false,
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

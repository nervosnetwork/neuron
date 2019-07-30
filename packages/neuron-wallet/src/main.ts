import { app } from 'electron'
import 'reflect-metadata'
import i18n from './utils/i18n'
import { updateApplicationMenu } from './utils/application-menu'

import Router from './router'
import WindowManager from './models/window-manager'
import createMainWindow from './startup/create-main-window'
import createSyncBlockTask from './startup/sync-block-task/create'
import initConnection from './database/address/ormconfig'
import WalletsService from './services/wallets'

const walletsService = WalletsService.getInstance()

const router = new Router()

Object.defineProperty(app, 'router', {
  value: router,
})

const openWindow = () => {
  if (!WindowManager.mainWindow) {
    WindowManager.mainWindow = createMainWindow()
    WindowManager.mainWindow.on('closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
      if (WindowManager.mainWindow) {
        WindowManager.mainWindow.removeAllListeners()
        WindowManager.mainWindow = null
      }
    })
  }
}

app.on('ready', async () => {
  i18n.changeLanguage(['zh', 'zh-CN'].includes(app.getLocale()) ? 'zh' : 'en')
  const wallets = walletsService.getAll()
  const currentWallet = walletsService.getCurrent()

  updateApplicationMenu(wallets, currentWallet ? currentWallet.id : null)
  await initConnection()
  createSyncBlockTask()
  openWindow()
})

app.on('activate', openWindow)

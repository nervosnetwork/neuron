import { app } from 'electron'
import 'reflect-metadata'
import i18n from './utils/i18n'
import { updateApplicationMenu } from './utils/application-menu'

import Router from './router'
import createWindow from './startup/create-window'
import createSyncBlockTask from './startup/sync-block-task/create'
import initConnection from './database/address/ormconfig'
import WalletsService from './services/wallets'

const walletsService = WalletsService.getInstance()

let mainWindow: Electron.BrowserWindow | null

const router = new Router()

Object.defineProperty(app, 'router', {
  value: router,
})

const openWindow = () => {
  if (!mainWindow) {
    mainWindow = createWindow()
    mainWindow.on('closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
      if (mainWindow) {
        mainWindow.removeAllListeners()
        mainWindow = null
      }
    })
  }
}

app.on('ready', async () => {
  i18n.changeLanguage(app.getLocale())
  const wallets = walletsService.getAll()
  const currentWallet = walletsService.getCurrent()

  updateApplicationMenu(wallets, currentWallet && currentWallet.id)
  await initConnection()
  createSyncBlockTask()
  openWindow()
})

app.on('activate', openWindow)

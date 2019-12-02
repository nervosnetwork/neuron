import { app } from 'electron'

import WalletService from 'services/wallets'
import NodeController from 'controllers/node'
import SyncController from 'controllers/sync'
import AppController from 'controllers/app'
import { changeLanguage } from 'utils/i18n'
import env from 'env'

const appController = new AppController()

app.on('ready', async () => {
  changeLanguage(app.getLocale())

  WalletService.getInstance().generateAddressesIfNecessary()
  if (!env.isTestMode) {
    await NodeController.startNode()
    SyncController.startSyncing()
  }

  appController.openWindow()
})

app.on('will-quit', () => {
  if (!env.isTestMode) {
    SyncController.stopSyncing()
    NodeController.stopNode()
  }
})

app.on('activate', appController.openWindow)

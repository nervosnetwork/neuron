import { app } from 'electron'

import AppController from 'controllers/app'
import WalletService from 'services/wallets'
import createSyncBlockTask from 'startup/sync-block-task/create'
import { changeLanguage } from 'utils/i18n'

const appController = new AppController()

app.on('ready', async () => {
  changeLanguage(app.getLocale())

  WalletService.getInstance().generateAddressesIfNecessary()
  createSyncBlockTask()

  appController.openWindow()
})

app.on('activate', appController.openWindow)

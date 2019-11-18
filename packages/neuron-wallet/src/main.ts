import { app } from 'electron'

import AppController from 'controllers/app'
import SyncController from 'controllers/sync'
import WalletService from 'services/wallets'
import { changeLanguage } from 'utils/i18n'

const appController = new AppController()

app.on('ready', async () => {
  changeLanguage(app.getLocale())

  WalletService.getInstance().generateAddressesIfNecessary()
  SyncController.startSyncing()

  appController.openWindow()
})

app.on('activate', appController.openWindow)

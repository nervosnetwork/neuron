import { app } from 'electron'

import WalletService from 'services/wallets'
import NetworksController from 'controllers/networks'
import NodeController from 'controllers/node'
import SyncController from 'controllers/sync'
import AppController from 'controllers/app'
import { changeLanguage } from 'utils/i18n'
import env from 'env'
import { register as registerListeners } from 'listeners/main'

import leveldb from 'database/leveldb'
import logger from 'utils/logger'

const appController = new AppController()

app.on('ready', async () => {
  changeLanguage(app.getLocale())

  registerListeners()

  NetworksController.startUp()
  WalletService.getInstance().generateAddressesIfNecessary()

  if (!env.isTestMode) {
    await NodeController.startNode()
    SyncController.startSyncing()
  }

  testLeveldb()

  appController.openWindow()
})

app.on('before-quit', async () => {
  if (!env.isTestMode) {
    // No need to stop syncing as background process will be killed
    NodeController.stopNode()
  }
})

app.on('activate', appController.openWindow)

// Remove this after testing out
const testLeveldb = () => {
  const db = leveldb('cells/testdb', 'subdb')
  db.put('info', { version: 1 })
    .then(() => {
      return db.get('info')
    })
    .then(val => {
      logger.debug("Leveldb get key info:", val)
    })
    .catch(error => {
      logger.error(error)
    })
}

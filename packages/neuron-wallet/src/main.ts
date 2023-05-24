import { app } from 'electron'

import AppController from 'controllers/app'
import SettingsService from 'services/settings'
import { changeLanguage } from 'locales/i18n'
import logger from 'utils/logger'

const appController = AppController.getInstance()

const singleInstanceLock = app.requestSingleInstanceLock()
if (singleInstanceLock) {
  app.on('ready', async () => {
    logger.info('App:\tNeuron is starting')
    changeLanguage(SettingsService.getInstance().locale)

    appController.start()
  })

  app.on('before-quit', async () => {
    logger.info('App:\tNeuron will exit')
    await appController.end()
  })

  app.on('activate', appController.openWindow)

  app.on('second-instance', () => {
    appController.restoreWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  process.on('uncaughtException', (err, origin) => {
    logger.error(`UncaughtException:\tCaught exception: `, err)
    logger.error(`UncaughtException:\tException origin: `, origin)
  })
} else {
  app.quit()
}

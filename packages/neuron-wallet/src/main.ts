import { app } from 'electron'

import AppController from 'controllers/app'
import SettingsService from 'services/settings'
import { changeLanguage } from 'locales/i18n'

const appController = new AppController()

const singleInstanceLock = app.requestSingleInstanceLock()
if (singleInstanceLock) {
  app.on('ready', async () => {
    changeLanguage(SettingsService.getInstance().locale)

    appController.start()
  })

  app.on('before-quit', async () => {
    appController.end()
  })

  app.on('activate', appController.openWindow)

  app.on('second-instance', () => {
    appController.restoreWindow()
  })
} else {
  app.quit()
}

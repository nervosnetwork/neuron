import { app } from 'electron'

import AppController from 'controllers/app'
import initConnection from 'database/address/ormconfig'
import createSyncBlockTask from 'startup/sync-block-task/create'
import { changeLanguage } from 'utils/i18n'

const appController = new AppController()

app.on('ready', async () => {
  changeLanguage(app.getLocale())

  await initConnection()
  createSyncBlockTask()

  appController.openWindow()
})

app.on('activate', appController.openWindow)

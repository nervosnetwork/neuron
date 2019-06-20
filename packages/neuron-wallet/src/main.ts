import { app, Menu } from 'electron'
import 'reflect-metadata'
import i18n from './utils/i18n'
import applicationMenu from './utils/application-menu'

import Router from './router'
import createWindow from './startup/create-window'
import createSyncBlockTask from './startup/sync-block-task/create'
import initConnection from './addresses/ormconfig'

let mainWindow: Electron.BrowserWindow | null

const router = new Router()

Object.defineProperty(app, 'router', {
  value: router,
})
const openWindow = () => {
  if (!mainWindow) {
    mainWindow = createWindow()
    mainWindow.on('closed', () => {
      if (mainWindow) {
        mainWindow = null
      }
    })
  }
}

app.on('ready', () => {
  i18n.changeLanguage(app.getLocale())
  Menu.setApplicationMenu(applicationMenu)
  initConnection()
  createSyncBlockTask()
  openWindow()
})

app.on('activate', openWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

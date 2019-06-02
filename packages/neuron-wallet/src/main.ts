import { app, Menu } from 'electron'
import 'reflect-metadata'

import initApp from './startup/init-app'
import createWindow from './startup/create-window'
import createSyncBlockTask from './startup/sync-block-task/create'

import i18n from './utils/i18n'
import mainmenu from './utils/mainmenu'

let mainWindow: Electron.BrowserWindow | null

const openWindow = () => {
  i18n.changeLanguage(app.getLocale())
  Menu.setApplicationMenu(mainmenu())
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
  initApp()
  openWindow()
  createSyncBlockTask()
})

app.on('activate', openWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

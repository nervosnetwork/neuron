import { MenuItem, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import i18n from 'utils/i18n'

autoUpdater.autoDownload = false

let updaterMenuItem: MenuItem | null
const enableUpdaterMenuItem = () => {
  if (updaterMenuItem) {
    updaterMenuItem.enabled = true
  }
  updaterMenuItem = null
}

autoUpdater.on('error', error => {
  dialog.showErrorBox('Error', error == null ? 'unknown' : (error.stack || error).toString())
  enableUpdaterMenuItem()
})

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(
    {
      type: 'info',
      message: i18n.t('updater.updates-found-do-you-want-to-update'),
      buttons: [i18n.t('updater.update-now'), i18n.t('common.no')],
    },
    buttonIndex => {
      if (buttonIndex === 0) {
        autoUpdater.downloadUpdate()
      } else {
        enableUpdaterMenuItem()
      }
    }
  )
})

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox({
    type: 'info',
    message: i18n.t('updater.update-not-available'),
    buttons: [i18n.t('common.ok')],
  })
  enableUpdaterMenuItem()
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(
    {
      type: 'info',
      message: i18n.t('updater.updates-downloaded-about-to-quit-and-install'),
      buttons: [i18n.t('common.ok')],
    },
    () => {
      setImmediate(() => autoUpdater.quitAndInstall())
    }
  )
})

export default class UpdateController {
  public static checkUpdates(menuItem: MenuItem) {
    updaterMenuItem = menuItem
    updaterMenuItem.enabled = false

    autoUpdater.checkForUpdates()
  }
}

import { MenuItem, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import i18n from '../utils/i18n'

export default class UpdateController {
  updaterMenuItem: MenuItem | null

  constructor() {
    autoUpdater.autoDownload = false
    this.updaterMenuItem = null

    this.bindEvents()
  }

  public checkUpdates(menuItem: MenuItem) {
    this.updaterMenuItem = menuItem
    this.updaterMenuItem.enabled = false

    autoUpdater.checkForUpdates()
  }

  bindEvents() {
    autoUpdater.removeAllListeners()

    autoUpdater.on('error', error => {
      dialog.showErrorBox('Error', error == null ? 'unknown' : (error.stack || error).toString())
      this.enableUpdaterMenuItem()
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
            this.enableUpdaterMenuItem()
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
      this.enableUpdaterMenuItem()
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
  }

  enableUpdaterMenuItem() {
    if (this.updaterMenuItem) {
      this.updaterMenuItem.enabled = true
    }
    this.updaterMenuItem = null
  }
}

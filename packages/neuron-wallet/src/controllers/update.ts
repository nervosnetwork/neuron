import { dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import i18n from 'utils/i18n'

export default class UpdateController {
  sender: { enabled: boolean } | null

  constructor() {
    autoUpdater.autoDownload = false
    this.sender = null

    this.bindEvents()
  }

  public checkUpdates(sender: { enabled: boolean }) {
    this.sender = sender
    this.sender.enabled = false

    autoUpdater.checkForUpdates()
  }

  bindEvents() {
    autoUpdater.removeAllListeners()

    autoUpdater.on('error', error => {
      dialog.showErrorBox('Error', error == null ? 'unknown' : (error.stack || error).toString())
      this.enableSender()
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
            this.enableSender()
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
      this.enableSender()
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

  enableSender() {
    if (this.sender) {
      this.sender.enabled = true
    }
    this.sender = null
  }
}

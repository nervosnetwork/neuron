import { dialog } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import i18n from 'utils/i18n'
import AppUpdaterSubject from 'models/subjects/app-updater'

export default class UpdateController {
  static isChecking = false // One instance is already running and checking

  constructor() {
    autoUpdater.autoDownload = false

    if (!UpdateController.isChecking) {
      this.bindEvents()
    }
  }

  public checkUpdates() {
    UpdateController.isChecking = true
    autoUpdater.checkForUpdates()

    AppUpdaterSubject.next({
      checking: true,
      downloadProgress: -1,
      version: '',
      releaseNotes: ''
    })
  }

  bindEvents() {
    autoUpdater.removeAllListeners()

    autoUpdater.on('error', error => {
      dialog.showErrorBox('Error', error == null ? 'unknown' : (error.stack || error).toString())

      UpdateController.isChecking = false
      this.notify()
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      UpdateController.isChecking = false
      this.notify(-1, info.version, 'todo')
    })

    autoUpdater.on('update-not-available', () => {
      dialog.showMessageBox({
        type: 'info',
        message: i18n.t('updater.update-not-available'),
        buttons: [i18n.t('common.ok')],
      })

      UpdateController.isChecking = false
      this.notify()
    })

    autoUpdater.on('update-downloaded', () => {
      dialog
        .showMessageBox({
          type: 'info',
          message: i18n.t('updater.updates-downloaded-about-to-quit-and-install'),
          buttons: [i18n.t('common.ok')],
        })
        .then(() => {
          setImmediate(() => autoUpdater.quitAndInstall())
        })

      UpdateController.isChecking = false
      this.notify(1, 'toto', '')
    })
  }

  private notify(downloadProgress: number = -1, version = '', releaseNotes = '') {
    AppUpdaterSubject.next({
      checking: UpdateController.isChecking,
      downloadProgress,
      version,
      releaseNotes
    })
  }
}

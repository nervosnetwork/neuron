import { autoUpdater, UpdateInfo, CancellationToken } from 'electron-updater'
import AppUpdaterSubject from '../models/subjects/app-updater'

export default class UpdateController {
  static isChecking = false // One instance is already running and checking

  static downCancellationToken = new CancellationToken()

  constructor(check: boolean = true) {
    autoUpdater.autoDownload = false

    if (check && !UpdateController.isChecking) {
      this.bindEvents()
    }
  }

  public checkUpdates() {
    UpdateController.isChecking = true
    autoUpdater.checkForUpdates()

    this.notify()
  }

  public cancelCheckUpdates() {
    autoUpdater.removeAllListeners()
    UpdateController.isChecking = false
    this.notify()
  }

  public quitAndInstall() {
    setImmediate(() => {
      autoUpdater.quitAndInstall()
    })
  }

  public downloadUpdate() {
    this.notify(0)
    autoUpdater.downloadUpdate(UpdateController.downCancellationToken)
  }

  public cancelDownloadUpdate() {
    autoUpdater.removeAllListeners()
    UpdateController.downCancellationToken.cancel()
    this.notify()
  }

  private bindEvents() {
    autoUpdater.removeAllListeners()

    autoUpdater.on('error', error => {
      UpdateController.isChecking = false
      this.notify(-1, null, false, '', '', '', error == null ? 'unknown' : (error.stack || error).toString())
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      if (UpdateController.isChecking) {
        UpdateController.isChecking = false
        this.notify(-1, null, false, info.version, info.releaseDate, info.releaseNotes as string)
      }
    })

    autoUpdater.on('update-not-available', () => {
      if (UpdateController.isChecking) {
        UpdateController.isChecking = false
        this.notify(-1, null, true)
      }
    })

    autoUpdater.on('download-progress', progress => {
      const progressPercent = progress.percent / 100
      if (progressPercent !== 1) {
        this.notify(progressPercent, progress)
      }
    })

    autoUpdater.on('update-downloaded', () => {
      UpdateController.isChecking = false
      this.notify(1)
    })
  }

  private notify(
    downloadProgress: number = -1,
    progressInfo = null,
    isUpdated = false,
    version = '',
    releaseDate = '',
    releaseNotes = '',
    errorMsg = ''
  ) {
    AppUpdaterSubject.next({
      downloadProgress,
      progressInfo,
      isUpdated,
      version,
      releaseDate,
      releaseNotes,
      errorMsg,
      checking: UpdateController.isChecking,
    })
  }
}

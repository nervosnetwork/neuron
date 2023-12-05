import { autoUpdater, UpdateInfo, CancellationToken, ProgressInfo } from 'electron-updater'
import { net } from 'electron'
import AppUpdaterSubject, { AppUpdater } from '../models/subjects/app-updater'
import logger from '../utils/logger'

export default class UpdateController {
  static isChecking = false // One instance is already running and checking

  static downCancellationToken = new CancellationToken()

  static lastNotifyInfo: AppUpdater

  static updatePackageSize: number = 0

  constructor(check: boolean = true) {
    autoUpdater.autoDownload = false
    autoUpdater.logger = logger

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
    UpdateController.isChecking = false
    this.notify()
    autoUpdater.removeAllListeners()
  }

  public quitAndInstall() {
    setImmediate(() => {
      autoUpdater.quitAndInstall()
    })
  }

  public downloadUpdate() {
    this.notify({
      ...UpdateController.lastNotifyInfo,
      progressInfo: {
        total: UpdateController.updatePackageSize,
        percent: 0,
        transferred: 0,
      },
      downloadProgress: 0,
    })
    UpdateController.downCancellationToken = new CancellationToken()
    autoUpdater.downloadUpdate(UpdateController.downCancellationToken)
  }

  public cancelDownloadUpdate() {
    UpdateController.downCancellationToken.cancel()
    this.notify({ ...UpdateController.lastNotifyInfo, progressInfo: null, downloadProgress: -1 })
    autoUpdater.removeAllListeners()
  }

  private bindEvents() {
    autoUpdater.removeAllListeners()

    autoUpdater.on('error', error => {
      UpdateController.isChecking = false
      this.notify({
        version: '',
        releaseDate: '',
        releaseNotes: '',
        errorMsg: error == null ? 'unknown' : (error.stack || error).toString(),
      })
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      if (UpdateController.isChecking) {
        UpdateController.isChecking = false
        UpdateController.updatePackageSize = info.files[0].size ?? 0
        const request = net.request(`https://api.github.com/repos/nervosnetwork/neuron/releases/tags/v${info.version}`)
        request.on('response', response => {
          response.on('data', chunk => {
            const res = JSON.parse(chunk.toString())
            this.notify({
              version: info.version,
              releaseDate: res?.published_at || '',
              releaseNotes: info.releaseNotes as string,
            })
          })
        })
        request.on('error', () => {
          this.notify({
            version: info.version,
            releaseDate: '',
            releaseNotes: info.releaseNotes as string,
          })
        })
        request.end()
      }
    })

    autoUpdater.on('update-not-available', () => {
      if (UpdateController.isChecking) {
        UpdateController.isChecking = false
        this.notify({ isUpdated: true })
      }
    })

    autoUpdater.on('download-progress', (progressInfo: ProgressInfo) => {
      const progressPercent = progressInfo.percent / 100
      UpdateController.updatePackageSize = progressInfo.total
      if (progressPercent !== 1) {
        this.notify({ ...UpdateController.lastNotifyInfo, downloadProgress: progressPercent, progressInfo })
      }
    })

    autoUpdater.on('update-downloaded', () => {
      UpdateController.isChecking = false
      this.notify({ ...UpdateController.lastNotifyInfo, downloadProgress: 1 })
    })
  }

  private notify(appUpdater?: Partial<Omit<AppUpdater, 'checking'>>) {
    UpdateController.lastNotifyInfo = {
      downloadProgress: -1,
      progressInfo: null,
      isUpdated: false,
      version: '',
      releaseDate: '',
      releaseNotes: '',
      errorMsg: '',
      ...appUpdater,
      checking: UpdateController.isChecking,
    }
    AppUpdaterSubject.next(UpdateController.lastNotifyInfo)
  }
}

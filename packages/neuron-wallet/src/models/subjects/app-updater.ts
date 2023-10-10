import { Subject } from 'rxjs'

export interface AppUpdater {
  checking: boolean
  isUpdated: boolean
  downloadProgress: number // -1: not started, 1: finished, 0~1: downloading
  progressInfo: null | {
    total: number
    transferred: number
    percent: number
  }
  version: string // "": no update, "v.x.y.z": version v.x.y.z available
  releaseDate: string
  releaseNotes: string
  errorMsg: string
}

const AppUpdaterSubject = new Subject<AppUpdater>()

export default AppUpdaterSubject

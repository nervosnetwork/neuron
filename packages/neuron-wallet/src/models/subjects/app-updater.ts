import { Subject } from 'rxjs'

const AppUpdaterSubject = new Subject<{
  checking: boolean
  isUpdated: boolean
  downloadProgress: number // -1: not started, 1: finished, 0~1: downloading
  progressInfo: object
  version: string // "": no update, "v.x.y.z": version v.x.y.z available
  releaseDate: string
  releaseNotes: string
  errorMsg: string
}>()

export default AppUpdaterSubject

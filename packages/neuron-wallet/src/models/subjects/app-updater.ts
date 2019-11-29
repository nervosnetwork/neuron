import { Subject } from 'rxjs'

const AppUpdaterSubject = new Subject<{
  checking: boolean
  downloadProgress: number, // -1: not started, 1: finished, 0~1: downloading
  version: string, // "": no update, "v.x.y.z": version v.x.y.z available
  releaseNotes: string
}>()

export default AppUpdaterSubject

import { Subject } from 'rxjs'

const ShowGlobalDialogSubject = new Subject<{
  title?: string
  message?: string
  type: 'success' | 'failed' | 'warning'
  action?: 'ok' | 'cancel'
}>()

export default ShowGlobalDialogSubject

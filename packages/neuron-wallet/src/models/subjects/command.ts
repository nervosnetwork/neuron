import { Subject } from 'rxjs'

const CommandSubject = new Subject<{
  winID: number
  type: 'nav' | 'delete-wallet' | 'backup-wallet'
  payload: string | null
}>()

export default CommandSubject

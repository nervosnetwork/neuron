import { Subject } from 'rxjs'

const CommandSubject = new Subject<{
  winID: number
  type: 'navigate-to-url' | 'delete-wallet' | 'backup-wallet' | 'export-xpubkey'
  payload: string | null
  dispatchToUI: boolean
}>()

export default CommandSubject

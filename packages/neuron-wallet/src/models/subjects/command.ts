import { Subject } from 'rxjs'

const CommandSubject = new Subject<{
  winID: number
  type: 'nav' | 'delete-wallet' | 'backup-wallet'
  payload: string | null
}>()

// Commands that don't dispatch to UI
export const ApiCommandSubject = new Subject<{
  type: 'export-xpubkey'
  payload: string | null
}>()

export default CommandSubject

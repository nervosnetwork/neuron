import { Subject } from 'rxjs'

const CommandSubject = new Subject<{
  winID: number
  type: 'nav' | 'toggleAddressBook' | 'deleteWallet' | 'backupWallet'
  payload: string | null
}>()

export default CommandSubject

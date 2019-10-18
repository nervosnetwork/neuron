import { Subject } from 'rxjs'
import MainWindowController from 'controllers/main-window'

const CommandSubject = new Subject<{
  winID: number
  type: 'nav' | 'toggle-address-book' | 'delete-wallet' | 'backup-wallet'
  payload: string | null
}>()

CommandSubject.subscribe(params => {
  MainWindowController.sendMessage('command', params)
})

export default CommandSubject

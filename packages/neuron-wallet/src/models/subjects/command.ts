import { Subject } from 'rxjs'
import WindowManager from 'models/window-manager'

const CommandSubject = new Subject<{
  winID: number
  type: 'nav' | 'toggle-address-book' | 'delete-wallet' | 'backup-wallet'
  payload: string | null
}>()

CommandSubject.subscribe(params => {
  WindowManager.sendCommand(params)
})

export default CommandSubject

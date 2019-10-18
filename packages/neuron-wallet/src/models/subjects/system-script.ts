import { BehaviorSubject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import MainWindowController from 'controllers/main-window'

const DEBOUNCE_TIME = 50

export const SystemScriptSubject = new BehaviorSubject<{ codeHash: string }>({ codeHash: '' })
export const DebouncedSystemScriptSubject = SystemScriptSubject.pipe(debounceTime(DEBOUNCE_TIME))

DebouncedSystemScriptSubject.subscribe(params => {
  MainWindowController.systemScriptUpdated(params)
})

export default { SystemScriptSubject, DebouncedSystemScriptSubject }

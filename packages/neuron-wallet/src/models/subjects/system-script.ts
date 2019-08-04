import { BehaviorSubject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import WindowManager from 'models/window-manager'

const DEBOUNCE_TIME = 50

export const SystemScriptSubject = new BehaviorSubject<{ codeHash: string }>({ codeHash: '' })
export const DebouncedSystemScriptSubject = SystemScriptSubject.pipe(debounceTime(DEBOUNCE_TIME))

DebouncedSystemScriptSubject.subscribe(params => {
  WindowManager.systemScriptUpdated(params)
})

export default { SystemScriptSubject, DebouncedSystemScriptSubject }

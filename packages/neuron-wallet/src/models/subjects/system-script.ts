import { BehaviorSubject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'

const DEBOUNCE_TIME = 50

export const SystemScriptSubject = new BehaviorSubject<{ codeHash: string }>({ codeHash: '' })
export const DebouncedSystemScriptSubject = SystemScriptSubject.pipe(debounceTime(DEBOUNCE_TIME))

export default { SystemScriptSubject, DebouncedSystemScriptSubject }

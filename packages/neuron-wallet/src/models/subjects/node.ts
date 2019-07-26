import { BehaviorSubject } from 'rxjs'

export const ConnectionStatusSubject = new BehaviorSubject<boolean>(false)
export const SyncedBlockNumberSubject = new BehaviorSubject<string>('0')

export default { ConnectionStatusSubject, SyncedBlockNumberSubject }

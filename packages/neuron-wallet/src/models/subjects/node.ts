import { BehaviorSubject } from 'rxjs'
import { debounceTime, sampleTime } from 'rxjs/operators'

const DEBOUNCE_TIME = 50
const SAMPLE_TIME = 500

export const ConnectionStatusSubject = new BehaviorSubject<boolean>(false)
export const SyncedBlockNumberSubject = new BehaviorSubject<string>('0')

export const DebouncedConnectionStatusSubject = ConnectionStatusSubject.pipe(debounceTime(DEBOUNCE_TIME))
export const SampledSyncedBlockNumberSubject = SyncedBlockNumberSubject.pipe(sampleTime(SAMPLE_TIME))

export default {
  ConnectionStatusSubject,
  SyncedBlockNumberSubject,
  DebouncedConnectionStatusSubject,
  SampledSyncedBlockNumberSubject,
}

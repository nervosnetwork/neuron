import { BehaviorSubject } from 'rxjs'
import { debounceTime, sampleTime } from 'rxjs/operators'
import MainWindowController from 'controllers/main-window'

const DEBOUNCE_TIME = 50
const SAMPLE_TIME = 500

export const ConnectionStatusSubject = new BehaviorSubject<boolean>(false)
export const SyncedBlockNumberSubject = new BehaviorSubject<string>('0')

export const DebouncedConnectionStatusSubject = ConnectionStatusSubject.pipe(debounceTime(DEBOUNCE_TIME))
export const SampledSyncedBlockNumberSubject = SyncedBlockNumberSubject.pipe(sampleTime(SAMPLE_TIME))

DebouncedConnectionStatusSubject.subscribe(params => {
  MainWindowController.sendMessage('connection-status-updated', params)
})

SampledSyncedBlockNumberSubject.subscribe(params => {
  MainWindowController.sendMessage('synced-block-number-updated', params)
})

export default {
  ConnectionStatusSubject,
  SyncedBlockNumberSubject,
  DebouncedConnectionStatusSubject,
  SampledSyncedBlockNumberSubject,
}

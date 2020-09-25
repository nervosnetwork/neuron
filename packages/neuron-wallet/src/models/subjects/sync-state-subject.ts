import { BehaviorSubject } from 'rxjs'

const SyncStateSubject = new BehaviorSubject<{
  timestamp: number,
  indexerTip: number,
  cacheTip: number,
  indexRate: number | undefined,
  cacheRate: number | undefined,
  estimate: number | undefined,
  synced: boolean,
}>({
  timestamp: 0,
  indexerTip: 0,
  cacheTip: 0,
  indexRate: undefined,
  cacheRate: undefined,
  estimate: undefined,
  synced: false,
})

export default SyncStateSubject

import { BehaviorSubject } from 'rxjs'

const SyncStateSubject = new BehaviorSubject<{
  timestamp: number,
  indexerTipNumber: number,
  cacheTipNumber: number,
  indexRate: number | undefined,
  cacheRate: number | undefined,
  estimate: number | undefined,
  synced: boolean,
  status: number
}>({
  timestamp: 0,
  indexerTipNumber: 0,
  cacheTipNumber: 0,
  indexRate: undefined,
  cacheRate: undefined,
  estimate: undefined,
  synced: false,
  status: 0,
})

export default SyncStateSubject

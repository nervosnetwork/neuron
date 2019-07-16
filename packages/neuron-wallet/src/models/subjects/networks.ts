import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import DataUpdateSubject from './data-update'

const DEBOUNCE_TIME = 50

export const NetworkListSubject = new Subject<{
  currentNetworkList: Controller.Network[]
}>()
export const CurrentNetworkIDSubject = new Subject<{ currentNetworkID: Controller.NetworkID }>()

NetworkListSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(() => {
  DataUpdateSubject.next({ dataType: 'network', actionType: 'update' })
})

CurrentNetworkIDSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(() => {
  DataUpdateSubject.next({ dataType: 'network', actionType: 'update' })
})

export default {
  NetworkListSubject,
  CurrentNetworkIDSubject,
}

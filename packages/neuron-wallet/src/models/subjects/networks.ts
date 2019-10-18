import { BehaviorSubject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'

const DEBOUNCE_TIME = 50

export const NetworkListSubject = new BehaviorSubject<{
  currentNetworkList: Controller.Network[]
}>({ currentNetworkList: [] })
export const CurrentNetworkIDSubject = new BehaviorSubject<{ currentNetworkID: Controller.NetworkID }>({
  currentNetworkID: '',
})

export const DebouncedNetworkListSubject = NetworkListSubject.pipe(debounceTime(DEBOUNCE_TIME))
export const DebouncedCurrentNetworkIDSubject = CurrentNetworkIDSubject.pipe(debounceTime(DEBOUNCE_TIME))

export default {
  NetworkListSubject,
  CurrentNetworkIDSubject,
  DebouncedNetworkListSubject,
  DebouncedCurrentNetworkIDSubject,
}

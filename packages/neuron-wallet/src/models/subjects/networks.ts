import { BehaviorSubject } from 'rxjs'

export const NetworkListSubject = new BehaviorSubject<{
  currentNetworkList: Controller.Network[]
}>({ currentNetworkList: [] })
export const CurrentNetworkIDSubject = new BehaviorSubject<{ currentNetworkID: Controller.NetworkID }>({
  currentNetworkID: '',
})

export default {
  NetworkListSubject,
  CurrentNetworkIDSubject,
}

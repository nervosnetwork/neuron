import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { broadcastCurrentNetworkID, broadcastNetworkList } from '../../utils/broadcast'

const DEBOUNCE_TIME = 50

export const NetworkListSubject = new Subject<{
  currentNetworkList: Controller.Network[]
}>()
export const CurrentNetworkIDSubject = new Subject<{ currentNetworkID: Controller.NetworkID }>()

NetworkListSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(
  ({ currentNetworkList = [] }: { currentNetworkList: Controller.Network[] }) => {
    broadcastNetworkList(currentNetworkList)
  }
)

CurrentNetworkIDSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(({ currentNetworkID = '' }) => {
  broadcastCurrentNetworkID(currentNetworkID)
})

export default {
  NetworkListSubject,
  CurrentNetworkIDSubject,
}

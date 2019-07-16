import { Subject } from 'rxjs'
import windowManager from '../window-manager'

const DataUpdateSubject = new Subject<{
  dataType: 'address' | 'transaction' | 'wallet' | 'network'
  actionType: 'create' | 'update' | 'delete'
}>()

DataUpdateSubject.subscribe(({ dataType, actionType }) => {
  windowManager.broadcastDataUpdateMessage(actionType, dataType)
})

export default DataUpdateSubject

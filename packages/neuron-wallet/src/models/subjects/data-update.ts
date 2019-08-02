import { Subject } from 'rxjs'
import WindowManager from '../window-manager'

export const DataUpdateSubject = new Subject<{
  dataType: 'address' | 'transaction' | 'wallets' | 'current-wallet' | 'network'
  actionType: 'create' | 'update' | 'delete'
}>()

DataUpdateSubject.subscribe(data => {
  WindowManager.dataUpdated(data)
})

export default DataUpdateSubject

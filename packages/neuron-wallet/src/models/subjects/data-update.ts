import { Subject } from 'rxjs'
import MainWindowController from 'controllers/main-window'

export const DataUpdateSubject = new Subject<{
  dataType: 'address' | 'transaction' | 'wallets' | 'current-wallet' | 'network'
  actionType: 'create' | 'update' | 'delete'
}>()

DataUpdateSubject.subscribe(data => {
  MainWindowController.dataUpdated(data)
})

export default DataUpdateSubject

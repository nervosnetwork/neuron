import { Subject } from 'rxjs'

export const DataUpdateSubject = new Subject<{
  dataType: 'address' | 'transaction' | 'wallet' | 'network'
  actionType: 'create' | 'update' | 'delete'
  walletID?: string
}>()

export default DataUpdateSubject

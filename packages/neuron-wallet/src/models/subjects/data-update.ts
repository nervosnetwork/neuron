import { Subject } from 'rxjs'

export const DataUpdateSubject = new Subject<{
  dataType: 'address' | 'transaction' | 'wallets' | 'current-wallet' | 'network'
  actionType: 'create' | 'update' | 'delete'
}>()

export default DataUpdateSubject

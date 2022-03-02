import { debounceTime } from 'rxjs/operators'
import TxDbChangedSubject from 'models/subjects/tx-db-changed-subject'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import DataUpdateSubject from 'models/subjects/data-update'

/**
 * Update addresses and transactions actively
 */
export const register = () => {
  if (process.type === 'renderer') {
    throw new Error('Only call listeners/main in main process!')
  }

  TxDbChangedSubject.getSubject()
    .pipe(debounceTime(500))
    .subscribe(() => {
      DataUpdateSubject.next({ dataType: 'transaction', actionType: 'update' })
    })

  AddressDbChangedSubject.getSubject()
    .pipe(debounceTime(200))
    .subscribe(() => {
      DataUpdateSubject.next({ dataType: 'address', actionType: 'update' })
    })
}

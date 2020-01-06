import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import { debounceTime } from 'rxjs/operators'
import DataUpdateSubject from 'models/subjects/data-update'

export const register = () => {
  AddressDbChangedSubject.getSubject()
  .pipe(debounceTime(200))
  .subscribe(() => {
    DataUpdateSubject.next({
      dataType: 'address',
      actionType: 'update',
    })
  })
}

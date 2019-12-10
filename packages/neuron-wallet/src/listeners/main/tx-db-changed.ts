import TxDbChangedSubject from "models/subjects/tx-db-changed-subject"
import { debounceTime } from "rxjs/operators"
import DataUpdateSubject from "models/subjects/data-update"

export const register = () => {
  TxDbChangedSubject.getSubject().pipe(debounceTime(500)).subscribe(() => {
    DataUpdateSubject.next({
      dataType: 'transaction',
      actionType: 'update',
    })
  })
}

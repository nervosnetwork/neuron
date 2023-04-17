import { debounceTime } from 'rxjs/operators'
import TxDbChangedSubject from 'models/subjects/tx-db-changed-subject'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import DataUpdateSubject from 'models/subjects/data-update'
import MultisigConfigDbChangedSubject from 'models/subjects/multisig-config-db-changed-subject'
import MultisigService from 'services/multisig'

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

  MultisigConfigDbChangedSubject.getSubject()
    .pipe(debounceTime(500))
    .subscribe(async event => {
      try {
        if (event === 'AfterInsert') {
          await MultisigService.saveLiveMultisigOutput()
        } else if (event === 'AfterRemove') {
          await MultisigService.deleteRemovedMultisigOutput()
        }
      } catch (error) {
        // ignore error, these config cell will saving at next sync
      }
    })
  AddressDbChangedSubject.getSubject()
    .pipe(debounceTime(200))
    .subscribe(() => {
      DataUpdateSubject.next({ dataType: 'address', actionType: 'update' })
    })
}

import { ReplaySubject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { Transaction } from 'types/cell-types'
import DataUpdateSubject from './data-update'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export interface TransactionChangedMessage {
  event: string
  tx: Transaction
}

// subscribe this Subject to monitor any transaction table changes
export class TxDbChangedSubject {
  private static subject = new ReplaySubject<TransactionChangedMessage>(100)

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/tx-db-changed-subjects').default.getSubject()
    } else {
      return this.subject
    }
  }

  static subscribe = () => {
    TxDbChangedSubject.subject.pipe(debounceTime(500)).subscribe(() => {
      DataUpdateSubject.next({
        dataType: 'transaction',
        actionType: 'update',
      })
    })
  }

  static unsubscribe = () => {
    if (TxDbChangedSubject.subject) {
      TxDbChangedSubject.subject.unsubscribe()
    }
  }
}

TxDbChangedSubject.subscribe()

export default TxDbChangedSubject

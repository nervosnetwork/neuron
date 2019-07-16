import { ReplaySubject } from 'rxjs'
import { Transaction } from '../../types/cell-types'
import DataUpdateSubject from './data-update'

export interface TransactionChangedMessage {
  event: string
  tx: Transaction
}

// subscribe this Subject to monitor any transaction table changes
export class TxDbChangedSubject {
  static subject = new ReplaySubject<TransactionChangedMessage>(100)

  static getSubject() {
    return TxDbChangedSubject.subject
  }

  static setSubject(subject: ReplaySubject<TransactionChangedMessage>) {
    TxDbChangedSubject.unsubscribe()
    TxDbChangedSubject.subject = subject
    TxDbChangedSubject.subscribe()
  }

  static subscribe = () => {
    TxDbChangedSubject.subject.subscribe(() => {
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

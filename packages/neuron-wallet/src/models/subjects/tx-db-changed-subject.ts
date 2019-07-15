import { ReplaySubject } from 'rxjs'
import { ResponseCode, Channel } from '../../utils/const'
import { Transaction } from '../../types/cell-types'
import windowManager from '../window-manager'

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
    TxDbChangedSubject.subject.subscribe(({ event, tx }) => {
      const result = {
        event,
        txHash: tx.hash,
      }
      windowManager.broadcast(Channel.Transactions, 'transactionUpdated', {
        status: ResponseCode.Success,
        result,
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

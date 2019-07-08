import { ReplaySubject } from 'rxjs'
import { Transaction } from '../../types/cell-types'

export interface TransactionChangedMessage {
  event: string
  tx: Transaction
}

// subscribe this Subject to monitor any transaction table changes
export class TxDbChangedSubject {
  static subject = new ReplaySubject<TransactionChangedMessage>(100)

  static getSubject() {
    return this.subject
  }

  static setSubject(subject: ReplaySubject<TransactionChangedMessage>) {
    this.subject = subject
  }
}

export default TxDbChangedSubject

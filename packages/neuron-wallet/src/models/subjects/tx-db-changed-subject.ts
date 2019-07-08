import { ReplaySubject } from 'rxjs'
import { Transaction } from '../../types/cell-types'

export interface EventAndTx {
  event: string
  tx: Transaction
}

// subscribe this Subject to monitor any transaction table changes
export class TxDbChangedSubject {
  static subject = new ReplaySubject<EventAndTx>(100)

  static getSubject() {
    return this.subject
  }

  static setSubject(subject: ReplaySubject<EventAndTx>) {
    this.subject = subject
  }
}

export default TxDbChangedSubject

import { ReplaySubject } from 'rxjs'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'
import { Transaction } from 'models/chain/transaction'

export interface TransactionChangedMessage {
  event: string
  tx: Transaction
}

// subscribe this Subject to monitor any transaction table changes
export class TxDbChangedSubject {
  private static subject = new ReplaySubject<TransactionChangedMessage>(100)

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/tx-db-changed-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

export default TxDbChangedSubject

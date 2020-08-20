import { ReplaySubject } from 'rxjs'

export interface TransactionChangedMessage {
  event: string
}

// subscribe this Subject to monitor any transaction table changes
export class TxDbChangedSubject {
  private static subject = new ReplaySubject<TransactionChangedMessage>(100)

  public static getSubject() {
    return this.subject
  }
}

export default TxDbChangedSubject

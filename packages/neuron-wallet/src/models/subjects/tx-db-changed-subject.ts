import { ReplaySubject } from 'rxjs'

// subscribe this Subject to monitor any transaction table changes
export class TxDbChangedSubject {
  static subject = new ReplaySubject<string>(100)

  static getSubject() {
    return this.subject
  }

  static setSubject(subject: ReplaySubject<string>) {
    this.subject = subject
  }
}

export default TxDbChangedSubject

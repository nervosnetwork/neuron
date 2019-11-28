import { Subject } from 'rxjs'

export class WalletCreatedSubject {
  static subject = new Subject<string>()

  static getSubject() {
    return this.subject
  }

  static setSubject(subject: Subject<string>) {
    this.subject = subject
  }
}

export default WalletCreatedSubject

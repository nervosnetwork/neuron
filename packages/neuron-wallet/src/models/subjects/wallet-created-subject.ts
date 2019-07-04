import { ReplaySubject } from 'rxjs'

export class WalletCreatedSubject {
  static subject = new ReplaySubject<string>(1)

  static getSubject() {
    return this.subject
  }

  static setSubject(subject: ReplaySubject<string>) {
    this.subject = subject
  }
}

export default WalletCreatedSubject

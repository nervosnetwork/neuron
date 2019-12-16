import { Subject } from 'rxjs'

export class WalletCreatedSubject {
  private static subject = new Subject<string>()

  public static getSubject() {
    return this.subject
  }
}

export default WalletCreatedSubject

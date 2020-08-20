import { Subject } from 'rxjs'

export default class WalletDeletedSubject {
  private static subject = new Subject<string>()

  public static getSubject() {
    return this.subject
  }
}

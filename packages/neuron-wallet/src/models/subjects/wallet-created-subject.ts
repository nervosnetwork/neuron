import { Subject } from 'rxjs'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export class WalletCreatedSubject {
  private static subject = new Subject<string>()

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/wallet-created-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

export default WalletCreatedSubject

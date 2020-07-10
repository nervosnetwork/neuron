import { Subject } from 'rxjs'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export default class WalletDeletedSubject {
  private static subject = new Subject<string>()

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/wallet-delete-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

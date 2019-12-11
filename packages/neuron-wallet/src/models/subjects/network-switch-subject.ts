import { BehaviorSubject } from 'rxjs'
import { NetworkWithID } from 'types/network'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export default class NetworkSwitchSubject {
  private static subject = new BehaviorSubject<undefined | NetworkWithID>(undefined)

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/network-switch-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

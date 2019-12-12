import { ReplaySubject } from 'rxjs'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

// subscribe this Subject to monitor any address table changes
export class AddressDbChangedSubject {
  private static subject = new ReplaySubject<string>(100)

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/address-db-changed-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

export default AddressDbChangedSubject

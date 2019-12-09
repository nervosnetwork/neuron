import { ReplaySubject } from 'rxjs'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export interface AddressesWithURL {
  addresses: string[]
  url: string
}

// subscribe this Subject to monitor which addresses are used
export class AddressesUsedSubject {
  private static subject = new ReplaySubject<AddressesWithURL>(100)

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/addresses-used-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

export default AddressesUsedSubject

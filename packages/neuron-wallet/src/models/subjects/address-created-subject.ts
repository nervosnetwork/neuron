import { ReplaySubject } from 'rxjs'
import { Address } from 'database/address/address-dao'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export default class AddressCreatedSubject {
  private static subject = new ReplaySubject<Address[]>(100)

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/address-created-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

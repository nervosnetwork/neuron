import { ReplaySubject } from 'rxjs'
import { Address } from 'database/address/address-dao'
import { remote } from 'electron'
import ProcessUtils from 'utils/process'

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

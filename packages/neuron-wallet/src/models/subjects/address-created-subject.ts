import { ReplaySubject } from 'rxjs'
import { AddressWithWay } from 'services/addresses'

export default class AddressCreatedSubject {
  static subject = new ReplaySubject<AddressWithWay[]>(100)

  static getSubject() {
    return this.subject
  }
}

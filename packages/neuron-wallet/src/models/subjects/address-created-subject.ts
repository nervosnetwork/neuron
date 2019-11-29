import { ReplaySubject } from 'rxjs'
import { Address } from 'database/address/address-dao'

export default class AddressCreatedSubject {
  static subject = new ReplaySubject<Address[]>(100)

  static getSubject() {
    return this.subject
  }

  static setSubject(subject: ReplaySubject<Address[]>) {
    this.subject = subject
  }
}

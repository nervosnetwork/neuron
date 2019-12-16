import { ReplaySubject } from 'rxjs'
import { Address } from 'database/address/address-dao'

export default class AddressCreatedSubject {
  private static subject = new ReplaySubject<Address[]>(100)

  public static getSubject() {
    return this.subject
  }
}

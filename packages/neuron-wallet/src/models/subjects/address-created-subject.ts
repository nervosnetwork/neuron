import { ReplaySubject } from 'rxjs'
import { Address } from "models/address"

export default class AddressCreatedSubject {
  private static subject = new ReplaySubject<Address[]>(100)

  public static getSubject() {
    return AddressCreatedSubject.subject
  }
}

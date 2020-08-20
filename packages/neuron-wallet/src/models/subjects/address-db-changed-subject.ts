import { ReplaySubject } from 'rxjs'

// subscribe this Subject to monitor any address table changes
export class AddressDbChangedSubject {
  private static subject = new ReplaySubject<string>(100)

  public static getSubject() {
    return this.subject
  }
}

export default AddressDbChangedSubject

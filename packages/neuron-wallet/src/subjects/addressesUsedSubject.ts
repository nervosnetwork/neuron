import { ReplaySubject } from 'rxjs'

// subscribe this Subject to monitor which addresses are used
export class AddressesUsedSubject {
  static subject = new ReplaySubject<string[]>(100)

  static getSubject() {
    return this.subject
  }

  static setSubject(subject: ReplaySubject<string[]>) {
    this.subject = subject
  }
}

export default AddressesUsedSubject

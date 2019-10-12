import { ReplaySubject } from 'rxjs'

export interface AddressesWithURL {
  addresses: string[]
  url: string
}

// subscribe this Subject to monitor which addresses are used
export class AddressesUsedSubject {
  static subject = new ReplaySubject<AddressesWithURL>(100)

  static getSubject() {
    return this.subject
  }

  static setSubject(subject: ReplaySubject<AddressesWithURL>) {
    this.subject = subject
  }
}

export default AddressesUsedSubject

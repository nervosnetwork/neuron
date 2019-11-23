import { BehaviorSubject } from 'rxjs'
import { NetworkWithID } from 'types/network'

export default class NetworkSwitchSubject {
  static subject = new BehaviorSubject<undefined | NetworkWithID>(undefined)

  static getSubject() {
    return this.subject
  }
}

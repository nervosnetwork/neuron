import { ReplaySubject } from 'rxjs'

export interface CurrentBlockInfo {
  blockNumber: string
}

// subscribe this Subject to monitor which addresses are used
export class CurrentBlockSubject {
  static subject = new ReplaySubject<CurrentBlockInfo>(1)

  static getSubject() {
    return this.subject
  }
}

export default CurrentBlockSubject

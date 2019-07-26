import { ReplaySubject } from 'rxjs'
import { sampleTime } from 'rxjs/operators'
import { SyncedBlockNumberSubject } from './node'

export interface CurrentBlockInfo {
  blockNumber: string
}

// subscribe this Subject to monitor which addresses are used
export class CurrentBlockSubject {
  static subject = new ReplaySubject<CurrentBlockInfo>(1)

  static getSubject() {
    return CurrentBlockSubject.subject
  }

  static subscribe() {
    CurrentBlockSubject.subject.pipe(sampleTime(500)).subscribe(({ blockNumber }) => {
      SyncedBlockNumberSubject.next(blockNumber)
    })
  }
}

CurrentBlockSubject.subscribe()

export default CurrentBlockSubject

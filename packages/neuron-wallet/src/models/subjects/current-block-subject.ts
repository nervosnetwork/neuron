import { ReplaySubject } from 'rxjs'
import { SyncedBlockNumberSubject } from './node'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export interface CurrentBlockInfo {
  blockNumber: string
}

// subscribe this Subject to monitor which addresses are used
export class CurrentBlockSubject {
  private static subject = new ReplaySubject<CurrentBlockInfo>(1)

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/current-block-subject').default.getSubject()
    } else {
      return this.subject
    }
  }

  static subscribe() {
    CurrentBlockSubject.subject.subscribe(({ blockNumber }) => {
      SyncedBlockNumberSubject.next(blockNumber)
    })
  }
}

CurrentBlockSubject.subscribe()

export default CurrentBlockSubject

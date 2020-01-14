import { ReplaySubject } from 'rxjs'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export interface CurrentBlockInfo {
  blockNumber: string
}

// Subscribe this subject to monitor which best block is processed
export class CurrentBlockSubject {
  private static subject = new ReplaySubject<CurrentBlockInfo>(1)

  public static getSubject(): ReplaySubject<CurrentBlockInfo> {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/current-block-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

export default CurrentBlockSubject

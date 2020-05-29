import { BehaviorSubject } from 'rxjs'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export const ConnectionStatusSubject = new BehaviorSubject<{
  url: string,
  connected: boolean
}>({
  url: '',
  connected: false
})

export default class SyncedBlockNumberSubject {
  private static subject = new BehaviorSubject<string>('0')

  public static getSubject(): BehaviorSubject<string> {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/node').default.getSubject()
    } else {
      return this.subject
    }
  }
}

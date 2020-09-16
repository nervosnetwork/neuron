import { BehaviorSubject } from 'rxjs'

export const ConnectionStatusSubject = new BehaviorSubject<{
  url: string,
  connected: boolean,
  isBundledNode: boolean,
  startedBundledNode: boolean,
}>({
  url: '',
  connected: false,
  isBundledNode: true,
  startedBundledNode: false,
})

export default class SyncedBlockNumberSubject {
  private static subject = new BehaviorSubject<string>('0')

  public static getSubject(): BehaviorSubject<string> {
    return SyncedBlockNumberSubject.subject
  }
}

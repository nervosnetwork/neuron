import { BehaviorSubject } from 'rxjs'

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
    return SyncedBlockNumberSubject.subject
  }
}

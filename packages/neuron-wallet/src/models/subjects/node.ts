import { BehaviorSubject } from 'rxjs'
import { take } from 'rxjs/operators'

export type ConnectionStatus = {
  url: string,
  connected: boolean,
  isBundledNode: boolean,
  startedBundledNode: boolean,
}

export const ConnectionStatusSubject = new BehaviorSubject<ConnectionStatus>({
  url: '',
  connected: false,
  isBundledNode: true,
  startedBundledNode: false,
})

export const getLatestConnectionStatus = async () => {
  return new Promise(resolve => {
    ConnectionStatusSubject.pipe(take(1)).subscribe(
      status => { resolve(status) }
    )
  })
}

export default class SyncedBlockNumberSubject {
  private static subject = new BehaviorSubject<string>('0')

  public static getSubject(): BehaviorSubject<string> {
    return SyncedBlockNumberSubject.subject
  }
}

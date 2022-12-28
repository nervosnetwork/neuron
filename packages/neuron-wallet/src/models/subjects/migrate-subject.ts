import { Subject, timer, Subscription } from 'rxjs'

type MigrateMessage = { type: 'need-migrate' | 'migrating' | 'finish' | 'failed'; reason?: string }
export default class MigrateSubject {
  private static subject = new Subject<MigrateMessage>()

  private static timer: Subscription

  public static getSubject() {
    return MigrateSubject.subject
  }

  static next(message: MigrateMessage) {
    MigrateSubject.subject.next(message)
    MigrateSubject.timer?.unsubscribe()
    switch (message.type) {
      case 'need-migrate':
      case 'migrating':
        MigrateSubject.timer = timer(2000).subscribe(() => MigrateSubject.next(message))
        break
      default:
        break
    }
  }
}

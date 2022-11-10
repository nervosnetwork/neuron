import { Subject, timer, Subscription } from 'rxjs'

type MigrateType = 'need-migrate' | 'migrating' | 'failed' | 'finish'
export default class MigrateSubject {
  private static subject = new Subject<MigrateType>()

  private static timer: Subscription

  public static getSubject() {
    return MigrateSubject.subject
  }

  static next(type: MigrateType) {
    MigrateSubject.subject.next(type)
    MigrateSubject.timer?.unsubscribe()
    switch (type) {
      case 'need-migrate':
      case 'migrating':
        MigrateSubject.timer = timer(2000).subscribe(() => MigrateSubject.next(type))
        break
      default:
        break
    }
  }
}

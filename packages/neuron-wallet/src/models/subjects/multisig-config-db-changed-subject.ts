import { ReplaySubject } from 'rxjs'

// subscribe this Subject to monitor any transaction table changes
export class MultisigConfigDbChangedSubject {
  private static subject = new ReplaySubject<'AfterInsert' | 'AfterRemove'>(100)

  public static getSubject() {
    return MultisigConfigDbChangedSubject.subject
  }
}

export default MultisigConfigDbChangedSubject

import { ReplaySubject } from 'rxjs'

// subscribe this Subject to monitor any transaction table changes
export class MultisigOutputChangedSubject {
  private static subject = new ReplaySubject<'create' | 'delete' | 'update' | 'reset'>(100)

  public static getSubject() {
    return MultisigOutputChangedSubject.subject
  }
}

export default MultisigOutputChangedSubject

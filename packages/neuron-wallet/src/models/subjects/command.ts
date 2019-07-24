import { Subject } from 'rxjs'

const CommandSubject = new Subject<{ winID: number; type: 'nav' | 'toggleAddressBook'; payload: string | null }>()

export default CommandSubject

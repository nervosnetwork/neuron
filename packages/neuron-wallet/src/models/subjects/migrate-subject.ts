import { Subject } from 'rxjs'

export const MigrateSubject = new Subject<'migrating' | 'failed' | 'finish'>()

export default MigrateSubject

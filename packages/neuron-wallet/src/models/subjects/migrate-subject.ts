import { Subject } from 'rxjs'

export const MigrateSubject = new Subject<'need-migrate' | 'migrating' | 'failed' | 'finish'>()

export default MigrateSubject

import { BehaviorSubject } from 'rxjs'

const systemScriptSubject = new BehaviorSubject<{ codeHash: string }>({ codeHash: '' })

export default systemScriptSubject

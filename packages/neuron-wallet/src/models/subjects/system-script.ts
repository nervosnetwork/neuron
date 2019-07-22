import { BehaviorSubject } from 'rxjs'
import { Channel, ResponseCode } from '../../utils/const'
import windowManager from '../window-manager'

const systemScriptSubject = new BehaviorSubject<{ codeHash: string }>({ codeHash: '' })

systemScriptSubject.subscribe(({ codeHash }) => {
  windowManager.broadcast(Channel.Chain, 'systemScript', {
    status: ResponseCode.Success,
    result: {
      codeHash,
    },
  })
})

export default systemScriptSubject

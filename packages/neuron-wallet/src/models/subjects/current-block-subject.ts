import { ReplaySubject } from 'rxjs'
import { sampleTime } from 'rxjs/operators'
import windowManager from '../window-manager'
import { Channel, ResponseCode } from '../../utils/const'

export interface CurrentBlockInfo {
  blockNumber: string
}

// subscribe this Subject to monitor which addresses are used
export class CurrentBlockSubject {
  static subject = new ReplaySubject<CurrentBlockInfo>(1)

  static getSubject() {
    return CurrentBlockSubject.subject
  }

  static subscribe() {
    CurrentBlockSubject.subject.pipe(sampleTime(500)).subscribe(({ blockNumber }) => {
      windowManager.broadcast(Channel.Chain, 'tipBlockNumber', {
        status: ResponseCode.Success,
        result: blockNumber,
      })
    })
  }
}

CurrentBlockSubject.subscribe()

export default CurrentBlockSubject

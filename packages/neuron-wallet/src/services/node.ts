import { interval, Subject } from 'rxjs'
import { distinctUntilChanged, flatMap } from 'rxjs/operators'
import ckbCore from '../core'
import logger from '../utils/logger'

class NodeService {
  tick = interval(1000)

  tipNumberSubject = new Subject()

  start = () => {
    const { unsubscribe } = this.tipNumber()
    return unsubscribe
  }

  tipNumber = () =>
    this.tick
      .pipe(flatMap(() => ckbCore.rpc.getTipBlockNumber()))
      .pipe(distinctUntilChanged())
      .subscribe(
        tipNumber => this.tipNumberSubject.next(tipNumber),
        error =>
          logger.log({
            level: 'error',
            message: error.message,
          }),
      )

  tipHeader = () => this.tipNumberSubject.pipe(flatMap(ckbCore.rpc.getTipHeader))

  tipBlock = () => this.tipNumberSubject.pipe(flatMap(ckbCore.rpc.getBlockHash)).pipe(flatMap(ckbCore.rpc.getBlock))
}

const nodeService = new NodeService()

export default nodeService

import { interval, Subject } from 'rxjs'
import { distinctUntilChanged, flatMap, retry, filter } from 'rxjs/operators'
import ckbCore from '../core'

class NodeService {
  tick = interval(1000)

  tipNumberSubject = new Subject()

  start = () => {
    const { unsubscribe } = this.tipNumber()
    return unsubscribe
  }

  tipNumber = () =>
    this.tick
      .pipe(
        flatMap(() => ckbCore.rpc.getTipBlockNumber()),
        // TODO: to determine retry or not
        retry(3),
        distinctUntilChanged(),
      )
      .subscribe(
        tipNumber => {
          this.tipNumberSubject.next(tipNumber)
        },
        () => {
          this.tipNumberSubject.next(undefined)
          this.tipNumber()
        },
      )

  tipHeader = () =>
    this.tipNumberSubject.pipe(
      filter(tipNumber => typeof tipNumber !== 'undefined'),
      flatMap(ckbCore.rpc.getTipHeader),
    )

  tipBlock = () =>
    this.tipNumberSubject
      .pipe(
        filter(tipNumber => typeof tipNumber !== 'undefined'),
        flatMap(ckbCore.rpc.getBlockHash),
      )
      .pipe(flatMap(ckbCore.rpc.getBlock))
}

const nodeService = new NodeService()

export default nodeService

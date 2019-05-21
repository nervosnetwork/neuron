import Core from '@nervosnetwork/ckb-sdk-core'
import { interval, BehaviorSubject } from 'rxjs'
import { distinctUntilChanged, flatMap, delay, retry } from 'rxjs/operators'

class NodeService {
  public delayTime = 0
  public intervalTime = 1000
  public tipNumberSubject = new BehaviorSubject<string | undefined>(undefined)

  public core: Core = new Core('')

  setNetwork = (url: string) => {
    if (typeof url !== 'string') {
      throw new Error('url should be type of string')
    }
    if (!url.startsWith('http')) {
      throw new Error('Protocol of url should be specified')
    }
    this.core.setNode({ url })
    this.tipNumberSubject.next(undefined)
    return this.core
  }

  start = () => {
    const { unsubscribe } = this.tipNumber()
    this.stop = unsubscribe
  }

  public stop: Function | null = null

  tipNumber = () => {
    return interval(this.intervalTime)
      .pipe(
        delay(this.delayTime),
        flatMap(() => {
          return this.core.rpc.getTipBlockNumber()
        }),
        retry(3),
        distinctUntilChanged(),
      )
      .subscribe(
        tipNumber => {
          if (!this.delayTime) this.delayTime = 0
          this.tipNumberSubject.next(tipNumber)
        },
        () => {
          if (this.delayTime < 10 * this.intervalTime) {
            this.delayTime = 2 * this.intervalTime
          }
          this.tipNumberSubject.next(undefined)
          const { unsubscribe } = this.tipNumber()
          this.stop = unsubscribe
        },
      )
  }
}

export default NodeService

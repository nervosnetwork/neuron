import Core from '@nervosnetwork/ckb-sdk-core'
import { interval, Subject } from 'rxjs'
import { distinctUntilChanged, flatMap, retry, filter } from 'rxjs/operators'

class NodeService {
  tick = interval(1000)

  tipNumberSubject = new Subject()

  core: Core = new Core('')

  setNetwork = (url: string) => {
    if (typeof url !== 'string') {
      throw new Error('url should be type of string')
    }
    if (!url.startsWith('http')) {
      throw new Error('Protocol of url should be specified')
    }
    this.core = new Core(url)
    return this.core
  }

  start = () => {
    const { unsubscribe } = this.tipNumber()
    return unsubscribe
  }

  tipNumber = () =>
    this.tick
      .pipe(
        flatMap(() => {
          return this.core.rpc.getTipBlockNumber()
        }),
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
      flatMap(this.core.rpc.getTipHeader),
    )

  tipBlock = () =>
    this.tipNumberSubject
      .pipe(
        filter(tipNumber => typeof tipNumber !== 'undefined'),
        flatMap(this.core.rpc.getBlockHash),
      )
      .pipe(flatMap(this.core.rpc.getBlock))
}

export default NodeService

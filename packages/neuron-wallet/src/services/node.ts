import Core from '@nervosnetwork/ckb-sdk-core'
import { interval, BehaviorSubject } from 'rxjs'
import { distinctUntilChanged, flatMap, delay, retry } from 'rxjs/operators'
import { ShouldBeTypeOf } from '../exceptions'
import windowManager from '../models/window-manager'
import { Channel, ResponseCode } from '../utils/const'

class NodeService {
  private static instance: NodeService

  static getInstance(): NodeService {
    if (!NodeService.instance) {
      NodeService.instance = new NodeService()
    }
    return NodeService.instance
  }

  public delayTime = 0
  public intervalTime = 1000
  public tipNumberSubject = new BehaviorSubject<string | undefined>(undefined)
  public connectStatusSubject = new BehaviorSubject<boolean>(false)

  public core: Core = new Core('')

  constructor() {
    this.start()
    this.syncConnectStatus()
  }

  public syncConnectStatus = () => {
    this.tipNumberSubject.subscribe(tipNumber => {
      if (typeof tipNumber === 'string') {
        windowManager.broadcast(Channel.Chain, 'tipBlockNumber', {
          status: ResponseCode.Success,
          result: tipNumber,
        })
      }
    })
    this.connectStatusSubject.pipe(distinctUntilChanged()).subscribe(connectStatus => {
      windowManager.broadcast(Channel.Chain, 'status', {
        status: ResponseCode.Success,
        result: connectStatus,
      })
    })
  }

  public setNetwork = (url: string) => {
    if (typeof url !== 'string') {
      throw new ShouldBeTypeOf('URL', 'string')
    }
    if (!url.startsWith('http')) {
      throw new Error('Protocol of url should be specified')
    }
    this.core.setNode({ url })
    this.tipNumberSubject.next('0')
    this.connectStatusSubject.next(false)
    return this.core
  }

  public start = () => {
    const { unsubscribe } = this.tipNumber()
    this.stop = unsubscribe
  }

  public stop: Function | null = null

  public tipNumber = () => {
    return interval(this.intervalTime)
      .pipe(
        delay(this.delayTime),
        flatMap(() => {
          return this.core.rpc
            .getTipBlockNumber()
            .then(tipNumber => {
              this.connectStatusSubject.next(true)
              return tipNumber
            })
            .catch(err => {
              this.connectStatusSubject.next(false)
              throw err
            })
        }),
        retry(3),
        distinctUntilChanged()
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
        }
      )
  }
}

export default NodeService

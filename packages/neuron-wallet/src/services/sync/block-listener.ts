import { BehaviorSubject, Subscription } from 'rxjs'
import NodeService from '../node'
import Queue from './queue'
import RangeForCheck from './range-for-check'
import BlockNumber from './block-number'
import Utils from './utils'

export default class BlockListener {
  private lockHashes: string[]
  private tipBlockNumber: number = -1
  private queue: Queue | undefined | null = undefined
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber
  private interval: number = 5000
  private tipNumberListener: Subscription

  constructor(
    lockHashes: string[],
    tipNumberSubject: BehaviorSubject<string | undefined> = NodeService.getInstance().tipNumberSubject
  ) {
    this.lockHashes = lockHashes
    this.currentBlockNumber = new BlockNumber()
    this.rangeForCheck = new RangeForCheck()

    this.tipNumberListener = tipNumberSubject.subscribe(async num => {
      if (num) {
        this.tipBlockNumber = parseInt(num, 10)
      }
    })
  }

  public setLockHashes = (lockHashes: string[]) => {
    this.lockHashes = lockHashes
    if (!this.queue) {
      return
    }
    this.queue.setLockHashes(lockHashes)
  }

  // start listening
  /* eslint no-await-in-loop: "off" */
  /* eslint no-constant-condition: "off" */
  public start = async (restart: boolean = false) => {
    if (restart) {
      await this.currentBlockNumber.updateCurrent(BigInt(0))
    }
    while (this.queue !== null) {
      await this.regenerate()
      await Utils.sleep(this.interval)
    }
  }

  public stop = async () => {
    this.tipNumberListener.unsubscribe()
    if (!this.queue) {
      return
    }
    await this.queue.kill()
    this.queue = null
  }

  public regenerate = async (): Promise<void> => {
    if (this.queue && this.queue.length() > 0) {
      return
    }

    const current = await this.currentBlockNumber.getCurrent()
    const startBlockNumber: string = (current + BigInt(1)).toString()
    const endBlockNumber: string = this.tipBlockNumber.toString()

    this.generateQueue(startBlockNumber, endBlockNumber)
  }

  public generateQueue = (startBlockNumber: string, endBlockNumber: string): Queue | undefined => {
    if (BigInt(startBlockNumber) > BigInt(endBlockNumber)) {
      return undefined
    }

    if (!this.queue) {
      this.queue = new Queue(
        this.lockHashes,
        startBlockNumber,
        endBlockNumber,
        this.currentBlockNumber,
        this.rangeForCheck
      )
      this.queue.process()
    } else {
      this.queue.reset(startBlockNumber, endBlockNumber)
    }

    return this.queue
  }
}

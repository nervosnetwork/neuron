import { BehaviorSubject, Subscription } from 'rxjs'
import NodeService from 'services/node'
import logger from 'utils/logger'

import Queue from './queue'
import RangeForCheck from './range-for-check'
import BlockNumber from './block-number'
import GetBlocks from './get-blocks'

export default class BlockListener {
  private lockHashes: string[]
  private tipBlockNumber: bigint = BigInt(-1)
  private queue: Queue | undefined
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber
  private tipNumberSubject: BehaviorSubject<string | undefined>
  private tipNumberListener: Subscription | undefined

  constructor(
    lockHashes: string[],
    tipNumberSubject: BehaviorSubject<string | undefined> = NodeService.getInstance().tipNumberSubject
  ) {
    this.lockHashes = lockHashes
    this.currentBlockNumber = new BlockNumber()
    this.rangeForCheck = new RangeForCheck()
    this.tipNumberSubject = tipNumberSubject
  }

  public setLockHashes = (lockHashes: string[]) => {
    this.lockHashes = lockHashes
    if (!this.queue) {
      return
    }
    this.queue.setLockHashes(lockHashes)
  }

  // start listening
  public start = async (restart: boolean = false) => {
    if (restart) {
      await this.currentBlockNumber.updateCurrent(BigInt(0))
    }

    try {
      const getBlocksService = new GetBlocks()
      const currentTip = await getBlocksService.getTipBlockNumber()
      const startBlockNumber = await this.getStartBlockNumber()
      this.queue = new Queue(this.lockHashes, startBlockNumber, currentTip, this.currentBlockNumber, this.rangeForCheck)
    } catch (err) {
      logger.error(`BlockListener start error:`, err)
    }

    this.tipNumberListener = this.tipNumberSubject.subscribe(async num => {
      if (num) {
        this.tipBlockNumber = BigInt(num)
        await this.regenerate()
      }
    })
  }

  public stop = () => {
    if (this.tipNumberListener) {
      this.tipNumberListener.unsubscribe()
    }
    if (this.queue) {
      this.queue.stop()
    }
  }

  public stopAndWait = async () => {
    this.stop()
    if (this.queue) {
      await this.queue.waitForDrained()
    }
  }

  public getStartBlockNumber = async (): Promise<string> => {
    const current = await this.currentBlockNumber.getCurrent()
    const startBlockNumber: string = (current + BigInt(1)).toString()
    return startBlockNumber
  }

  public regenerate = async (): Promise<void> => {
    const endBlockNumber: string = this.tipBlockNumber.toString()

    if (this.queue) {
      this.queue.resetEndBlockNumber(endBlockNumber)
    } else {
      const startBlockNumber: string = await this.getStartBlockNumber()
      this.queue = new Queue(
        this.lockHashes,
        startBlockNumber,
        endBlockNumber,
        this.currentBlockNumber,
        this.rangeForCheck
      )
    }
  }
}

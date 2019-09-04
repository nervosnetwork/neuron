import { BehaviorSubject, Subscription } from 'rxjs'
import NodeService from 'services/node'
import logger from 'utils/logger'

import Queue from './queue'
import RangeForCheck from './range-for-check'
import BlockNumber from './block-number'
import GetBlocks from './get-blocks'
import Utils from './utils'

export default class BlockListener {
  private lockHashes: string[]
  private tipBlockNumber: bigint = BigInt(-1)
  private queue: Queue | undefined
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber
  private tipNumberSubject: BehaviorSubject<string | undefined>
  private tipNumberListener: Subscription | undefined
  private url: string

  constructor(
    url: string,
    lockHashes: string[],
    tipNumberSubject: BehaviorSubject<string | undefined> = NodeService.getInstance().tipNumberSubject
  ) {
    this.url = url
    this.lockHashes = lockHashes
    this.currentBlockNumber = new BlockNumber()
    this.rangeForCheck = new RangeForCheck(url)
    this.tipNumberSubject = tipNumberSubject
  }

  public setLockHashes = (lockHashes: string[]) => {
    this.lockHashes = lockHashes
    if (!this.queue) {
      return
    }
    this.queue.setLockHashes(lockHashes)
  }

  public appendLockHashes = (lockHashes: string[]) => {
    const hashes = this.lockHashes.concat(lockHashes)
    this.setLockHashes(hashes)
  }

  public getLockHashes = (): string[] => {
    return this.lockHashes
  }

  // start listening
  public start = async (restart: boolean = false) => {
    if (restart) {
      await this.currentBlockNumber.updateCurrent(BigInt(0))
    }

    try {
      const getBlocksService = new GetBlocks(this.url)
      const currentTip = await getBlocksService.getTipBlockNumber()
      const startBlockNumber = await this.getStartBlockNumber()
      this.queue = new Queue(
        this.url,
        this.lockHashes,
        startBlockNumber,
        currentTip,
        this.currentBlockNumber,
        this.rangeForCheck
      )
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

  /* eslint no-await-in-loop: "off" */
  /* eslint no-restricted-syntax: "off" */
  public setToTip = async () => {
    const timeout = 5000
    let number: bigint = BigInt(0)
    const tipNumberListener = this.tipNumberSubject.subscribe(async num => {
      if (num) {
        number = BigInt(num)
      }
    })
    const startAt = +new Date()
    while (number === BigInt(0)) {
      const now = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await Utils.sleep(100)
    }
    await this.currentBlockNumber.updateCurrent(this.tipBlockNumber)
    tipNumberListener.unsubscribe()
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
        this.url,
        this.lockHashes,
        startBlockNumber,
        endBlockNumber,
        this.currentBlockNumber,
        this.rangeForCheck
      )
    }
  }
}

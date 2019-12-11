import logger from 'utils/logger'

import Queue from './queue'
import RangeForCheck from './range-for-check'
import BlockNumber from './block-number'
import GetBlocks from './get-blocks'
import CommonUtils from 'utils/common'
import NodeService from 'services/node'

export default class BlockListener {
  private lockHashes: string[]
  private queue: Queue | undefined
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber
  private url: string

  constructor(
    url: string,
    lockHashes: string[],
  ) {
    this.url = url
    this.lockHashes = lockHashes
    this.currentBlockNumber = new BlockNumber()
    this.rangeForCheck = new RangeForCheck(url)
  }

  public setLockHashes = (lockHashes: string[]) => {
    const hashes = [...new Set(lockHashes)]
    this.lockHashes = hashes
    if (!this.queue) {
      return
    }
    this.queue.setLockHashes(hashes)
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
      await this.currentBlockNumber.updateCurrent(BigInt(-1))
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
  }

  private tipBlockNumber = (): bigint => {
    return BigInt(NodeService.getInstance().tipBlockNumber)
  }

  public setToTip = async () => {
    const timeout = 5000
    const startAt = +new Date()
    while (this.tipBlockNumber() === BigInt(0)) {
      const now = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await CommonUtils.sleep(100)
    }
    await this.currentBlockNumber.updateCurrent(this.tipBlockNumber())
  }

  public stop = () => {
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
      if (this.tipBlockNumber() > BigInt(0)) {
        this.queue.resetEndBlockNumber(endBlockNumber)
      }
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

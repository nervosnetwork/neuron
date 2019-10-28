import { Block, BlockHeader } from 'types/cell-types'
import { TransactionPersistor } from 'services/tx'
import logger from 'utils/logger'

import GetBlocks from './get-blocks'
import RangeForCheck, { CheckResultType } from './range-for-check'
import BlockNumber from './block-number'
import Utils from './utils'

export default class Queue {
  private lockHashes: string[]
  private getBlocksService: GetBlocks
  private startBlockNumber: bigint
  private endBlockNumber: bigint
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber

  private fetchSize: number = 4

  private stopped: boolean = false
  private inProcess: boolean = false

  private yieldTime = 1

  constructor(
    url: string,
    lockHashes: string[],
    startBlockNumber: string,
    endBlockNumber: string,
    currentBlockNumber: BlockNumber = new BlockNumber(),
    rangeForCheck: RangeForCheck = new RangeForCheck(url),
    start: boolean = true
  ) {
    this.lockHashes = lockHashes
    this.getBlocksService = new GetBlocks(url)
    this.startBlockNumber = BigInt(startBlockNumber)
    this.endBlockNumber = BigInt(endBlockNumber)
    this.rangeForCheck = rangeForCheck
    this.currentBlockNumber = currentBlockNumber
    if (start) {
      this.start()
    }
  }

  public setLockHashes = (lockHashes: string[]): void => {
    this.lockHashes = lockHashes
  }

  /* eslint no-await-in-loop: "off" */
  public start = async () => {
    while (!this.stopped) {
      try {
        this.inProcess = true

        if (this.lockHashes.length !== 0) {
          const current: bigint = await this.currentBlockNumber.getCurrent()
          const startNumber: bigint = current + BigInt(1)
          const endNumber: bigint = current + BigInt(this.fetchSize)
          const realEndNumber: bigint = endNumber < this.endBlockNumber ? endNumber : this.endBlockNumber

          if (realEndNumber >= this.endBlockNumber) {
            this.yieldTime = 1000
          } else {
            this.yieldTime = 1
          }

          if (realEndNumber >= startNumber) {
            const rangeArr = Utils.rangeForBigInt(startNumber, realEndNumber).map(num => num.toString())
            await this.pipeline(rangeArr)
          }
        }
      } catch (err) {
        if (err.message.startsWith('connect ECONNREFUSED')) {
          logger.debug(`sync error:`, err)
        } else {
          logger.error(`sync error:`, err)
        }
      } finally {
        await this.yield(this.yieldTime)
        this.inProcess = false
      }
    }
  }

  private yield = async (millisecond: number = 1) => {
    await Utils.sleep(millisecond)
  }

  public stop = () => {
    this.stopped = true
  }

  public waitForDrained = async (timeout: number = 5000) => {
    const startAt: number = +new Date()
    while (this.inProcess) {
      const now: number = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await this.yield(50)
    }
  }

  public stopAndWait = async (timeout: number = 5000) => {
    this.stop()
    await this.waitForDrained(timeout)
  }

  public pipeline = async (blockNumbers: string[]) => {
    // 1. get blocks
    const blocks: Block[] = await this.getBlocksService.getRangeBlocks(blockNumbers)
    const blockHeaders: BlockHeader[] = blocks.map(block => block.header)

    // 2. check blockHeaders
    const checkResult = await this.checkBlockHeader(blockHeaders)

    if (checkResult.type === CheckResultType.FirstNotMatch) {
      return
    }

    // 3. check and save
    await this.getBlocksService.checkAndSave(blocks, this.lockHashes)

    // 4. update currentBlockNumber
    const lastBlock = blocks[blocks.length - 1]
    await this.currentBlockNumber.updateCurrent(BigInt(lastBlock.header.number))

    // 5. update range
    this.rangeForCheck.pushRange(blockHeaders)
  }

  public checkBlockHeader = async (blockHeaders: BlockHeader[]) => {
    const checkResult = this.rangeForCheck.check(blockHeaders)
    if (!checkResult.success) {
      if (checkResult.type === CheckResultType.FirstNotMatch) {
        const range = await this.rangeForCheck.getRange()
        const rangeFirstBlockHeader: BlockHeader = range[0]
        await this.currentBlockNumber.updateCurrent(BigInt(rangeFirstBlockHeader.number))
        this.rangeForCheck.clearRange()
        await TransactionPersistor.deleteWhenFork(rangeFirstBlockHeader.number)
        throw new Error(`chain forked: ${checkResult.type}`)
      } else if (checkResult.type === CheckResultType.BlockHeadersNotMatch) {
        // throw here and retry 5 times
        throw new Error(`chain forked: ${checkResult.type}`)
      }
    }

    return checkResult
  }

  public reset = (startBlockNumber: string, endBlockNumber: string) => {
    const startInt: bigint = BigInt(startBlockNumber)
    const endInt: bigint = BigInt(endBlockNumber)

    if (this.startBlockNumber > this.endBlockNumber) {
      return
    }

    this.startBlockNumber = startInt
    this.endBlockNumber = endInt
  }

  public resetEndBlockNumber = (endBlockNumber: string) => {
    this.endBlockNumber = BigInt(endBlockNumber)
  }
}

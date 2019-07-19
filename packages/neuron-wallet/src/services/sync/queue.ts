import async from 'async'
import GetBlocks from './get-blocks'
import { Block, BlockHeader } from '../../types/cell-types'
import RangeForCheck from './range-for-check'
import BlockNumber from './block-number'
import Utils from './utils'

export default class Queue {
  private q: any
  private concurrent: number = 1
  private lockHashes: string[]
  private getBlocksService: GetBlocks
  private startBlockNumber: bigint
  private endBlockNumber: bigint
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber

  private fetchSize: number = 4
  private retryTime: number = 5

  constructor(
    lockHashes: string[],
    startBlockNumber: string,
    endBlockNumber: string,
    currentBlockNumber: BlockNumber = new BlockNumber(),
    rangeForCheck: RangeForCheck = new RangeForCheck()
  ) {
    this.generateQueue()
    this.lockHashes = lockHashes
    this.getBlocksService = new GetBlocks()
    this.startBlockNumber = BigInt(startBlockNumber)
    this.endBlockNumber = BigInt(endBlockNumber)
    this.rangeForCheck = rangeForCheck
    this.currentBlockNumber = currentBlockNumber
  }

  private generateQueue = () => {
    this.q = async.queue(this.getWorker(), this.concurrent)
  }

  private regenerateQueue = () => {
    this.q.kill()
    this.generateQueue()
  }

  public setLockHashes = (lockHashes: string[]): void => {
    this.lockHashes = lockHashes
  }

  private getWorker = () => {
    const worker = async (task: any, callback: any) => {
      try {
        await Utils.retry(this.retryTime, 0, async () => {
          await this.pipeline(task.blockNumbers)
        })
      } catch {
        this.q.kill()
        this.q.remove(() => true)
      }
      await callback()
    }
    return worker
  }

  public get = () => {
    return this.q
  }

  public pause = () => {
    this.q.pause()
  }

  public resume = () => {
    this.q.resume()
  }

  public kill = () => {
    this.q.kill()
    this.q.remove(() => true)
  }

  public pipeline = async (blockNumbers: string[]) => {
    // 1. get blocks
    const blocks: Block[] = await this.getBlocksService.getRangeBlocks(blockNumbers)
    const blockHeaders: BlockHeader[] = blocks.map(block => block.header)

    // TODO: 2. check blockHeaders
    await this.checkBlockHeader(blockHeaders)

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
      if (checkResult.type === 'first-not-match') {
        // TODO: reset currentBlockNumber
        const range = await this.rangeForCheck.getRange()
        const rangeFirstBlockHeader: BlockHeader = range[0]
        this.currentBlockNumber.updateCurrent(BigInt(rangeFirstBlockHeader.number))
        this.regenerateQueue()
        this.startBlockNumber = await this.currentBlockNumber.getCurrent()
        this.batchPush()
      } else if (checkResult.type === 'block-headers-not-match') {
        // TODO: throw here and retry 5 times
        throw new Error('chain forked')
      }
    }
  }

  public push = async (blockNumbers: string[]): Promise<void> => {
    await this.q.push({ blockNumbers })
  }

  public batchPush = (): void => {
    const rangeArr = this.range(this.startBlockNumber, this.endBlockNumber)

    const slice = this.eachSlice(rangeArr, this.fetchSize)

    slice.forEach(async arr => {
      await this.push(arr)
    })
  }

  public process = () => {
    if (this.startBlockNumber > this.endBlockNumber) {
      return undefined
    }
    return this.batchPush()
  }

  private eachSlice = (array: any[], size: number) => {
    const arr = []
    for (let i = 0, l = array.length; i < l; i += size) {
      arr.push(array.slice(i, i + size))
    }
    return arr
  }

  private range = (startNumber: bigint, endNumber: bigint): bigint[] => {
    const size = +(endNumber - startNumber + BigInt(1)).toString()
    return [...Array(size).keys()].map(i => BigInt(i) + startNumber)
  }
}

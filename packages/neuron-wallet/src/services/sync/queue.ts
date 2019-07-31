import GetBlocks from './get-blocks'
import { Block, BlockHeader } from '../../types/cell-types'
import RangeForCheck from './range-for-check'
import BlockNumber from './block-number'
import Utils from './utils'
import QueueAdapter from './queue-adapter'
import { TransactionPersistor } from '../tx'

export default class Queue {
  private q: QueueAdapter
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
    this.q = new QueueAdapter(this.getWorker(), this.concurrent)
    this.lockHashes = lockHashes
    this.getBlocksService = new GetBlocks()
    this.startBlockNumber = BigInt(startBlockNumber)
    this.endBlockNumber = BigInt(endBlockNumber)
    this.rangeForCheck = rangeForCheck
    this.currentBlockNumber = currentBlockNumber
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
        await callback()
      } catch {
        this.clear()
      }
    }
    return worker
  }

  public clear = () => {
    this.q.clear()
  }

  public get = () => {
    return this.q
  }

  public length = (): number => {
    return this.q.length()
  }

  public kill = () => {
    this.q.kill()
  }

  public drain = async () => {
    return this.q.drain()
  }

  public pipeline = async (blockNumbers: string[]) => {
    // 1. get blocks
    const blocks: Block[] = await this.getBlocksService.getRangeBlocks(blockNumbers)
    const blockHeaders: BlockHeader[] = blocks.map(block => block.header)

    // 2. check blockHeaders
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
        const range = await this.rangeForCheck.getRange()
        const rangeFirstBlockHeader: BlockHeader = range[0]
        await this.currentBlockNumber.updateCurrent(BigInt(rangeFirstBlockHeader.number))
        await this.rangeForCheck.clearRange()
        await TransactionPersistor.deleteWhenFork(rangeFirstBlockHeader.number)
        await this.clear()
        this.startBlockNumber = await this.currentBlockNumber.getCurrent()
        this.batchPush()
      } else if (checkResult.type === 'block-headers-not-match') {
        // throw here and retry 5 times
        throw new Error('chain forked')
      }
    }
  }

  public push = (blockNumbers: string[]): void => {
    this.q.push({ blockNumbers })
  }

  public batchPush = (): void => {
    const rangeArr = Utils.rangeForBigInt(this.startBlockNumber, this.endBlockNumber)

    const slice = Utils.eachSlice(rangeArr, this.fetchSize)

    slice.forEach(arr => {
      this.push(arr)
    })
  }

  public reset = (startBlockNumber: string, endBlockNumber: string) => {
    this.startBlockNumber = BigInt(startBlockNumber)
    this.endBlockNumber = BigInt(endBlockNumber)

    if (this.startBlockNumber > this.endBlockNumber) {
      return
    }

    this.clear()
    this.batchPush()
  }

  public process = () => {
    if (this.startBlockNumber > this.endBlockNumber) {
      return undefined
    }
    return this.batchPush()
  }
}

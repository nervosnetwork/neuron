import { BlockHeader } from 'types/cell-types'
import BlockNumber from './block-number'
import GetBlocks from './get-blocks'
import Utils from './utils'

export enum CheckResultType {
  FirstNotMatch = 'first-not-match',
  BlockHeadersNotMatch = 'block-headers-not-match',
}

export default class RangeForCheck {
  private range: BlockHeader[] = []
  private checkSize = 32
  private url: string

  constructor(url: string) {
    this.url = url
  }

  public getRange = async (): Promise<BlockHeader[]> => {
    if (this.range.length < this.checkSize) {
      this.range = await this.generateRange()
    }
    return this.range
  }

  public generateRange = async (): Promise<BlockHeader[]> => {
    const blockNumberService = new BlockNumber()
    const currentBlockNumber: bigint = await blockNumberService.getCurrent()
    const startBlockNumber: bigint = currentBlockNumber - BigInt(this.checkSize)
    const realStartBlockNumber: bigint = startBlockNumber > BigInt(0) ? startBlockNumber : BigInt(0)
    const blockNumbers = Utils.range(realStartBlockNumber.toString(), currentBlockNumber.toString())

    const getBlocksService = new GetBlocks(this.url)
    const headers: BlockHeader[] = await getBlocksService.getRangeBlockHeaders(blockNumbers)

    return headers
  }

  public setRange = (range: BlockHeader[]) => {
    this.range = range
  }

  public clearRange = () => {
    this.range = []
  }

  public pushRange = (range: BlockHeader[]) => {
    if (range.length <= 0) {
      return
    }

    if (this.range.length > 0) {
      const lastBlockHeader = this.range[this.range.length - 1]
      const firstBlockHeader = range[0]
      if (lastBlockHeader.hash !== firstBlockHeader.parentHash) {
        this.clearRange()
        return
      }
    }
    if (this.range.length >= this.checkSize) {
      this.range = this.range.slice(range.length).concat(range)
    } else {
      this.range = this.range.concat(range)
    }
  }

  public check = (blockHeaders: BlockHeader[]) => {
    if (blockHeaders.length === 0 || this.range.length === 0) {
      return {
        success: true,
      }
    }
    const lastBlockHeader = this.range[this.range.length - 1]
    const firstBlockHeader = blockHeaders[0]
    if (firstBlockHeader.number === '0') {
      return {
        success: true,
      }
    }
    if (lastBlockHeader.hash !== firstBlockHeader.parentHash) {
      return {
        success: false,
        type: CheckResultType.FirstNotMatch,
      }
    }

    for (let i = 1; i < blockHeaders.length; ++i) {
      const currentBlockHeader = blockHeaders[i]
      const previousBlockHeader = blockHeaders[i - 1]

      if (currentBlockHeader.parentHash !== previousBlockHeader.hash) {
        return {
          success: false,
          type: CheckResultType.BlockHeadersNotMatch,
        }
      }
    }

    return {
      success: true,
    }
  }
}

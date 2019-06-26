import { BlockHeader, Block } from '../../types/cell-types'
import BlockNumber from './block-number'
import GetBlocks from './get-blocks'
import Utils from './utils'

export default class RangeForCheck {
  private range: BlockHeader[] = []
  private checkSize = 12

  public getRange = async (): Promise<BlockHeader[]> => {
    if (this.range.length <= 0) {
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

    const getBlocksService = new GetBlocks()
    const blocks: Block[] = await getBlocksService.getRangeBlocks(blockNumbers)
    const blockHeaders: BlockHeader[] = blocks.map((block: Block) => {
      return block.header
    })

    return blockHeaders
  }

  public setRange = (range: BlockHeader[]) => {
    this.range = range
  }

  public pushRange = (range: BlockHeader[]) => {
    if (range.length <= 0) {
      return
    }

    if (this.range.length > 0) {
      const lastBlockHeader = this.range[this.range.length - 1]
      const firstBlockHeader = range[0]
      if (lastBlockHeader.hash !== firstBlockHeader.parentHash) {
        // TODO: should re generate range here, should ensure currentBlockNumber before
        throw new Error('not match')
      }
    }
    this.range = this.range.slice(range.length).concat(range)
  }

  public check = (blockHeaders: BlockHeader[]) => {
    if (blockHeaders.length === 0 || this.range.length === 0) {
      return {
        success: true,
      }
    }
    const lastBlockHeader = this.range[this.range.length - 1]
    const firstBlockHeader = blockHeaders[0]
    if (lastBlockHeader.hash !== firstBlockHeader.parentHash) {
      return {
        success: false,
        type: 'first-not-match',
      }
    }

    for (let i = 1; i < blockHeaders.length; ++i) {
      const currentBlockHeader = blockHeaders[i]
      const previousBlockHeader = blockHeaders[i - 1]

      if (currentBlockHeader.parentHash !== previousBlockHeader.hash) {
        return {
          success: false,
          type: 'block-headers-not-match',
        }
      }
    }

    return {
      success: true,
    }
  }
}

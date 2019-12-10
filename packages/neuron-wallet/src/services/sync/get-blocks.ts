import Core from '@nervosnetwork/ckb-sdk-core'
import { generateCore } from 'services/sdk-core'

import { Block, BlockHeader } from 'types/cell-types'
import TypeConvert from 'types/type-convert'
import HexUtils from 'utils/hex'
import CommonUtils from 'utils/common'

export default class GetBlocks {
  private retryTime: number
  private retryInterval: number
  private core: Core

  constructor(url: string, retryTime: number = 3, retryInterval: number = 100) {
    this.retryTime = retryTime
    this.retryInterval = retryInterval
    this.core = generateCore(url)
  }

  public getRangeBlocks = async (blockNumbers: string[]): Promise<Block[]> => {
    const blocks: Block[] = await Promise.all(
      blockNumbers.map(async num => {
        return this.retryGetBlock(num)
      })
    )

    return blocks
  }

  public getRangeBlockHeaders = async (blockNumbers: string[]): Promise<BlockHeader[]> => {
    const headers: BlockHeader[] = await Promise.all(
      blockNumbers.map(async num => {
        return this.retryGetBlockHeader(num)
      })
    )

    return headers
  }

  public getTipBlockNumber = async (): Promise<string> => {
    return this.core.rpc.getTipBlockNumber()
  }

  public retryGetBlock = async (num: string): Promise<Block> => {
    const block: Block = await this.retry(async () => {
      return await this.getBlockByNumber(num)
    })

    return block
  }

  public retryGetBlockHeader = async (num: string): Promise<BlockHeader> => {
    const header: BlockHeader = await this.retry(async () => {
      return await this.getBlockHeaderByNumber(num)
    })

    return header
  }

  public getTransaction = async (hash: string): Promise<CKBComponents.TransactionWithStatus> => {
    return await this.core.rpc.getTransaction(hash)
  }

  public getHeader = async (hash: string): Promise<BlockHeader | undefined> => {
    const result = await this.core.rpc.getHeader(hash)
    if (result) {
      return TypeConvert.toBlockHeader(result)
    }
    return undefined
  }

  public getBlockByNumber = async (num: string): Promise<Block> => {
    const block = await this.core.rpc.getBlockByNumber(HexUtils.toHex(num))
    return TypeConvert.toBlock(block)
  }

  public getBlockHeaderByNumber = async (num: string): Promise<BlockHeader> => {
    const header = await this.core.rpc.getHeaderByNumber(HexUtils.toHex(num))
    return TypeConvert.toBlockHeader(header)
  }

  public genesisBlockHash = async (): Promise<string> => {
    const hash: string = await this.retry(async () => {
      return await this.core.rpc.getBlockHash('0x0')
    })

    return hash
  }

  public getChain = async (): Promise<string> => {
    const chain: string = await this.retry(async () => {
      const i = await this.core.rpc.getBlockchainInfo()
      return i.chain
    })
    return chain
  }

  private async retry<T>(func: () => T): Promise<T> {
    return CommonUtils.retry(this.retryTime, this.retryInterval, func)
  }
}

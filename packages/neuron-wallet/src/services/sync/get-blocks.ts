import Core from '@nervosnetwork/ckb-sdk-core'

import { Block } from 'types/cell-types'
import TypeConvert from 'types/type-convert'
import { NetworkWithID } from 'services/networks'
import CheckAndSave from './check-and-save'
import Utils from './utils'

import { networkSwitchSubject } from './renderer-params'

let core: Core
networkSwitchSubject.subscribe((network: NetworkWithID | undefined) => {
  if (network) {
    core = new Core(network.remote)
  }
})

export default class GetBlocks {
  private retryTime: number
  private retryInterval: number

  constructor(retryTime: number = 3, retryInterval: number = 100) {
    this.retryTime = retryTime
    this.retryInterval = retryInterval
  }

  public getRangeBlocks = async (blockNumbers: string[]): Promise<Block[]> => {
    const blocks: Block[] = await Promise.all(
      blockNumbers.map(async num => {
        return this.retryGetBlock(num)
      })
    )

    return blocks
  }

  public getTipBlockNumber = async (): Promise<string> => {
    const tip: string = await core.rpc.getTipBlockNumber()
    return tip
  }

  public checkAndSave = async (blocks: Block[], lockHashes: string[]) => {
    return Utils.mapSeries(blocks, async (block: Block) => {
      const checkAndSave = new CheckAndSave(block, lockHashes)
      return checkAndSave.process()
    })
  }

  public retryGetBlock = async (num: string): Promise<Block> => {
    const block: Block = await Utils.retry(this.retryTime, this.retryInterval, async () => {
      const b: Block = await GetBlocks.getBlockByNumber(num)
      return b
    })

    return block
  }

  public static getBlockByNumber = async (num: string): Promise<Block> => {
    const block = await core.rpc.getBlockByNumber(num)
    return TypeConvert.toBlock(block)
  }

  public static genesisBlockHash = async (): Promise<string> => {
    const hash: string = await Utils.retry(3, 100, async () => {
      const h: string = await core.rpc.getBlockHash('0')
      return h
    })

    return hash
  }
}

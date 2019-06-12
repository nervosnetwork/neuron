import Core from '@nervosnetwork/ckb-sdk-core'

import { Block } from '../../app-types/types'
import TypeConvert from '../../app-types/type-convert'
import { networkSwitchSubject, NetworkWithID } from '../networks'
import CheckAndSave from './check-and-save'
import Utils from './utils'

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

  // TODO: if retryGetBlock() failed, this will also failed
  public getRangeBlocks = async (blockNumbers: string[]): Promise<Block[]> => {
    const blocks: Block[] = await Promise.all(
      blockNumbers.map(async num => {
        return this.retryGetBlock(num)
      }),
    )

    return blocks
  }

  public checkAndSave = async (blocks: Block[], lockHashes: string[]) => {
    return Utils.mapSeries(blocks, async (block: Block) => {
      const checkAndSave = new CheckAndSave(block, lockHashes)
      return checkAndSave.process()
    })
  }

  // TODO: if get any error after retry, should pause queue
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
}

import { getConnection } from 'typeorm'
import SyncInfoEntity from 'database/chain/entities/sync-info'
import SyncedBlockNumberSubject from "models/subjects/node"

// Keep track of synced block number.
export default class SyncedBlockNumber {
  private nextBlock: bigint | undefined = undefined

  // Get next block to scan. If syncing hasn't run yet return 0 (genesis block number).
  public getNextBlock = async (): Promise<bigint> => {
    if (this.nextBlock) {
      return this.nextBlock
    }

    const blockNumberEntity: SyncInfoEntity | undefined = await this.blockNumber()

    if (!blockNumberEntity) {
      return BigInt(0)
    }

    return BigInt(blockNumberEntity.value)
  }

  public setNextBlock = async (current: bigint): Promise<void> => {
    this.nextBlock = current
    SyncedBlockNumberSubject.getSubject().next(current.toString())

    let blockNumberEntity = await this.blockNumber()

    let skipSave = false
    if (blockNumberEntity && current - BigInt(blockNumberEntity.value) < BigInt(1000)) {
      // Only persist block number for every 1,000 blocks to reduce DB write.
      // Practically it's unnecessary to save every block height, as iterating
      // blocks is fast.
      skipSave = true
    }
    if (current === BigInt(0)) {
      // Initial or reset
      skipSave = false
    }

    if (skipSave) {
      return
    }

    if (!blockNumberEntity) {
      blockNumberEntity = new SyncInfoEntity()
      blockNumberEntity.name = SyncInfoEntity.CURRENT_BLOCK_NUMBER
    }
    blockNumberEntity.value = current.toString()
    await getConnection().manager.save(blockNumberEntity)
  }

  public reset = async(): Promise<void> => {
    return this.setNextBlock(BigInt(0))
  }

  private blockNumber = async (): Promise<SyncInfoEntity | undefined> => {
    const blockNumberEntity: SyncInfoEntity | undefined = await getConnection()
      .getRepository(SyncInfoEntity)
      .findOne({
        name: SyncInfoEntity.CURRENT_BLOCK_NUMBER,
      })

    return blockNumberEntity
  }
}

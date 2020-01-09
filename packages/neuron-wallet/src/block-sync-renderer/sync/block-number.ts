import { getConnection } from 'typeorm'
import SyncInfoEntity from 'database/chain/entities/sync-info'
import CurrentBlockSubject from 'models/subjects/current-block-subject'

export default class BlockNumber {
  private current: bigint | undefined = undefined

  public getCurrent = async (): Promise<bigint> => {
    if (this.current) {
      return this.current
    }

    const blockNumberEntity: SyncInfoEntity | undefined = await this.blockNumber()

    if (!blockNumberEntity) {
      return BigInt(-1)
    }

    return BigInt(blockNumberEntity.value)
  }

  public updateCurrent = async (current: bigint): Promise<void> => {
    this.current = current
    CurrentBlockSubject.getSubject().next({
      blockNumber: current.toString()
    })

    let blockNumberEntity = await this.blockNumber()
    if (blockNumberEntity && current - BigInt(blockNumberEntity.value) < BigInt(1000)) {
      // Only persist block number for every 1,000 blocks to reduce DB write.
      // Practically it's unnecessary to save every block height, as iterating
      // blocks is fast.
      return
    }

    if (!blockNumberEntity) {
      blockNumberEntity = new SyncInfoEntity()
      blockNumberEntity.name = SyncInfoEntity.CURRENT_BLOCK_NUMBER
    }
    blockNumberEntity.value = current.toString()
    await getConnection().manager.save(blockNumberEntity)
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

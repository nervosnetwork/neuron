import { getConnection } from 'typeorm'
import SyncInfoEntity from '../../entities/sync-info'

export default class BlockNumber {
  private current: bigint = BigInt(0)

  public getCurrent = async (): Promise<bigint> => {
    if (this.current) {
      return this.current
    }

    const blockNumberEntity: SyncInfoEntity | undefined = await this.blockNumber()

    if (!blockNumberEntity) {
      return BigInt(0)
    }

    return BigInt(blockNumberEntity.value)
  }

  public updateCurrent = async (current: bigint): Promise<void> => {
    let blockNumberEntity = await this.blockNumber()
    if (!blockNumberEntity) {
      blockNumberEntity = new SyncInfoEntity()
      blockNumberEntity.name = SyncInfoEntity.CURRENT_BLOCK_NUMBER
    }
    blockNumberEntity.value = current.toString()
    await getConnection().manager.save(blockNumberEntity)
    this.current = current
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

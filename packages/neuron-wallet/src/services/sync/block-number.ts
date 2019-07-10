import { remote } from 'electron'
import { getConnection } from 'typeorm'
import SyncInfoEntity from '../../database/chain/entities/sync-info'
import CurrentBlockSubject from '../../models/subjects/current-block-subject'

const isRenderer = process && process.type === 'renderer'
const currentBlockSubject = isRenderer
  ? remote.require('./models/subjects/current-block-subject').default.getSubject()
  : CurrentBlockSubject.getSubject()

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
    // broadcast current block number updated
    currentBlockSubject.next({
      blockNumber: blockNumberEntity.value,
    })
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

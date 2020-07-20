import { getConnection } from 'typeorm'
import SyncInfoEntity from 'database/chain/entities/sync-info'
import SyncedBlockNumberSubject from 'models/subjects/node'
import logger from 'utils/logger'

// Keep track of synced block number.
export default class SyncedBlockNumber {
  #blockNumberEntity: SyncInfoEntity | undefined = undefined

  private static lastSavedBlock: bigint = BigInt(-1)

  // Get next block to scan. If syncing hasn't run yet return 0 (genesis block number).
  public async getNextBlock(): Promise<bigint> {
    const blockNumber = BigInt((await this.blockNumber()).value)
    return blockNumber
  }

  public async setNextBlock(current: bigint): Promise<void> {
    SyncedBlockNumberSubject.getSubject().next(current.toString())

    const blockDiffAbs = Math.abs(Number(current) - Number(SyncedBlockNumber.lastSavedBlock))
    if (current === BigInt(0) || blockDiffAbs >= 10) {
      SyncedBlockNumber.lastSavedBlock = current

      let blockNumberEntity = await this.blockNumber()
      blockNumberEntity.value = current.toString()
      await getConnection().manager.save(blockNumberEntity)

      logger.info("Database:\tsaved synced block #" + current.toString())
    }
  }

  private async blockNumber(): Promise<SyncInfoEntity> {
    if (!this.#blockNumberEntity) {
      this.#blockNumberEntity = await getConnection()
        .getRepository(SyncInfoEntity)
        .findOne({
          name: SyncInfoEntity.CURRENT_BLOCK_NUMBER,
        })
    }

    if (!this.#blockNumberEntity) {
      this.#blockNumberEntity = new SyncInfoEntity()
      this.#blockNumberEntity.name = SyncInfoEntity.CURRENT_BLOCK_NUMBER
      this.#blockNumberEntity.value = '0'
    }

    return this.#blockNumberEntity
  }
}

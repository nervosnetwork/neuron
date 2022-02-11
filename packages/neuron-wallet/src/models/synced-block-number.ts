import { getConnection } from 'typeorm'
import SyncInfoEntity from 'database/chain/entities/sync-info'
import logger from 'utils/logger'

// Keep track of synced block number.
export default class SyncedBlockNumber {
  #blockNumberEntity?: SyncInfoEntity
  #lastSavedBlock: bigint = BigInt(-1)

  // Get next block to scan. If syncing hasn't run yet return 0 (genesis block number).
  public getNextBlock = () => this.#blockNumber().then(({ value }) => BigInt(value))

  public setNextBlock = async (current: bigint): Promise<void> => {
    const blockDiffAbs = Math.abs(Number(current) - Number(this.#lastSavedBlock))

    if (current === BigInt(0) || blockDiffAbs >= 10) {
      this.#lastSavedBlock = current

      let blockNumberEntity = await this.#blockNumber()
      blockNumberEntity.value = current.toString()
      await getConnection().manager.save(blockNumberEntity)

      logger.info("Database:\tsaved synced block #" + current.toString())
    }
  }

  #blockNumber = async (): Promise<SyncInfoEntity> => {
    if (!this.#blockNumberEntity) {
      let blockNumber = await getConnection().getRepository(SyncInfoEntity).findOne({ name: SyncInfoEntity.CURRENT_BLOCK_NUMBER })

      if (!blockNumber) {
        blockNumber = new SyncInfoEntity()
        blockNumber.name = SyncInfoEntity.CURRENT_BLOCK_NUMBER
        blockNumber.value = '0'
      }
      this.#blockNumberEntity = blockNumber
    }

    return this.#blockNumberEntity
  }
}

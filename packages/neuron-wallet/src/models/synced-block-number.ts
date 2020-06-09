import { getConnection } from 'typeorm'
import SyncInfoEntity from 'database/chain/entities/sync-info'
import SyncedBlockNumberSubject from 'models/subjects/node'
import logger from 'utils/logger'
import AssetAccountInfo from 'models/asset-account-info'

// Keep track of synced block number.
export default class SyncedBlockNumber {
  #blockNumberEntity: SyncInfoEntity | undefined = undefined
  #liveCellBlockNumberEntity: SyncInfoEntity | undefined = undefined
  #nextBlock: bigint | undefined = undefined

  private static lastSavedBlock: bigint = BigInt(-1)

  // Get next block to scan. If syncing hasn't run yet return 0 (genesis block number).
  public async getNextBlock(): Promise<bigint> {
    if (this.#nextBlock) {
      return this.#nextBlock
    }

    const blockNumber = BigInt((await this.blockNumber()).value)
    const liveCellBlockNumber = BigInt((await this.liveCellBlockNumber()).value)

    if (liveCellBlockNumber < blockNumber) {
      return liveCellBlockNumber
    }
    return blockNumber
  }

  public async setNextBlock(current: bigint): Promise<void> {
    this.#nextBlock = current
    SyncedBlockNumberSubject.getSubject().next(current.toString())

    if (current === BigInt(0) || SyncedBlockNumber.lastSavedBlock === BigInt(-1) || current - SyncedBlockNumber.lastSavedBlock >= BigInt(1000)) {
      // Only persist block number for every 1,000 blocks to reduce DB write.
      // Practically it's unnecessary to save every block height, as iterating
      // blocks is fast.
      //
      // Note: `#lastSavedBlock` is an instance property. If `SyncedBlockNumber` is used
      //   in multiple places to write next block number, reading them would get inconsistent results.

      SyncedBlockNumber.lastSavedBlock = current

      let blockNumberEntity = await this.blockNumber()
      blockNumberEntity.value = current.toString()
      getConnection().manager.save(blockNumberEntity)

      let liveCellBlockNumberEntity = await this.liveCellBlockNumber()
      if (current > BigInt(liveCellBlockNumberEntity.value)) {
        liveCellBlockNumberEntity.value = current.toString()
        await getConnection().manager.save(liveCellBlockNumberEntity)
      }

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

  private async liveCellBlockNumber(): Promise<SyncInfoEntity> {
    const assetAccountInfo = new AssetAccountInfo()

    if (!this.#liveCellBlockNumberEntity) {
      this.#liveCellBlockNumberEntity = await getConnection()
        .getRepository(SyncInfoEntity)
        .findOne({
          name: SyncInfoEntity.CURRENT_LIVE_CELL_BLOCK_NUMBER,
        })
    }

    if (!this.#liveCellBlockNumberEntity) {
      this.#liveCellBlockNumberEntity = new SyncInfoEntity()
      this.#liveCellBlockNumberEntity.name = SyncInfoEntity.CURRENT_LIVE_CELL_BLOCK_NUMBER
      this.#liveCellBlockNumberEntity.value = assetAccountInfo.sudtDeployHeight.toString()
    }

    return this.#liveCellBlockNumberEntity
  }
}

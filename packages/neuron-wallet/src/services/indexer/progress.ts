import { getConnection } from 'typeorm'
import SyncInfoEntity from 'database/chain/entities/sync-info'

export default class IndexerProgress {
  // a number between 0 and 1
  private current: string | undefined

  static CURRENT_INDEXER_PROGRESS = 'currentIndexerProgress'

  public getCurrent = async (): Promise<string> => {
    if (this.current) {
      return this.current
    }

    const indexerProgressEntity = await this.indexerProgress()

    if (!indexerProgressEntity) {
      return '0'
    }

    return indexerProgressEntity.value
  }

  public update = async (current: string): Promise<void> => {
    const oldCurrent = await this.getCurrent()
    if (current !== oldCurrent) {
      await this.updateCurrent(current)
    }
  }

  public updateCurrent = async (current: string): Promise<void> => {
    let indexerProgressEntity = await this.indexerProgress()

    if (!indexerProgressEntity) {
      indexerProgressEntity = new SyncInfoEntity()
      indexerProgressEntity.name = IndexerProgress.CURRENT_INDEXER_PROGRESS
    }

    indexerProgressEntity.value = current

    await getConnection().manager.save(indexerProgressEntity)

    this.current = current
  }

  private indexerProgress = async (): Promise<SyncInfoEntity | undefined> => {
    return getConnection()
      .getRepository(SyncInfoEntity)
      .findOne({
        name: IndexerProgress.CURRENT_INDEXER_PROGRESS,
      })
  }
}

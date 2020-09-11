import SyncedBlockNumber from 'models/synced-block-number'
import { resetSyncTask } from 'block-sync-renderer'
import ChainCleaner from 'database/chain/cleaner'
import { ResponseCode } from 'utils/const'

export default class SyncController {
  public async clearCache(clearIndexerFolder: boolean = false) {
    await this.doClearTask(clearIndexerFolder)
    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public async currentBlockNumber() {
    const blockNumber = new SyncedBlockNumber()
    const current: bigint = await blockNumber.getNextBlock()

    return {
      status: ResponseCode.Success,
      result: {
        currentBlockNumber: current.toString(),
      },
    }
  }

  private doClearTask = async (clearIndexerFolder: boolean) => {
    await resetSyncTask(false)
    await ChainCleaner.clean()
    await resetSyncTask(true, clearIndexerFolder)
  }
}

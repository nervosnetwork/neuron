import SyncedBlockNumber from 'models/synced-block-number'
import { createBlockSyncTask, killBlockSyncTask } from 'block-sync-renderer'
import ChainCleaner from 'database/chain/cleaner'
import { ResponseCode } from 'utils/const'
import AddressDao from 'database/address/address-dao'

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
    await killBlockSyncTask()
    AddressDao.resetAddresses()
    await ChainCleaner.clean()
    await createBlockSyncTask(clearIndexerFolder)
  }
}

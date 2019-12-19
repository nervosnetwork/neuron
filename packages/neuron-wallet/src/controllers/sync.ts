import BlockNumber from 'block-sync-renderer/sync/block-number'
import { createBlockSyncTask, killBlockSyncTask } from 'block-sync-renderer'
import ChainCleaner from 'database/chain/cleaner'
import { ResponseCode } from 'utils/const'
import AddressDao from 'database/address/address-dao'

export default class SyncController {
  public static async startSyncing() {
    await createBlockSyncTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static stopSyncing() {
    killBlockSyncTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static async clearCache() {
    SyncController.stopSyncing()
    AddressDao.resetAddresses()
    await ChainCleaner.clean()
    return this.startSyncing()
  }

  public static async currentBlockNumber() {
    const blockNumber = new BlockNumber()
    const current: bigint = await blockNumber.getCurrent()

    return {
      status: ResponseCode.Success,
      result: {
        currentBlockNumber: current.toString(),
      },
    }
  }
}

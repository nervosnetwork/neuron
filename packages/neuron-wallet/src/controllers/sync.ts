import BlockNumber from 'block-sync-renderer/sync/block-number'
import { createBlockSyncTask, killBlockSyncTask } from 'block-sync-renderer'
import ChainCleaner from 'database/chain/cleaner'
import { ResponseCode } from 'utils/const'
import AddressDao from 'database/address/address-dao'

export default class SyncController {
  public static startSyncing() {
    createBlockSyncTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static async stopSyncing() {
    await killBlockSyncTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static async clearCache() {
    return new Promise(resolve => {
      SyncController.stopSyncing().finally(() => {
        AddressDao.resetAddresses()
        ChainCleaner.clean().finally(() => {
          return resolve(this.startSyncing())
        })
      })
    })
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

import BlockNumber from 'services/sync/block-number'
import { createSyncBlockTask, killSyncBlockTask } from 'startup/sync-block-task'
import ChainCleaner from 'database/chain/cleaner'
import { ResponseCode } from 'utils/const'
import AddressDao from 'database/address/address-dao'

export default class SyncController {
  public static startSyncing() {
    createSyncBlockTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static async stopSyncing() {
    await killSyncBlockTask()

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

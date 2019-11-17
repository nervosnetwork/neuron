import BlockNumber from 'services/sync/block-number'
import { createSyncBlockTask, killSyncBlockTask } from 'startup/sync-block-task/create'
import ChainCleaner from 'database/chain/cleaner'
import { ResponseCode } from 'utils/const'

export default class SyncController {
  public static async startSyncing() {
    createSyncBlockTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static async stopSyncing() {
    killSyncBlockTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static async deleteData() {
    ChainCleaner.clean()

    return {
      status: ResponseCode.Success,
      result: true
    }
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

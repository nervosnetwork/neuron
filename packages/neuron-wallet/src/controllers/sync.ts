import BlockNumber from 'models/block-number'
import { createBlockSyncTask, killBlockSyncTask } from 'block-sync-renderer'
import ChainCleaner from 'database/chain/cleaner'
import { ResponseCode } from 'utils/const'
import AddressDao from 'database/address/address-dao'

export default class SyncController {
  public async clearCache() {
    killBlockSyncTask()
    AddressDao.resetAddresses()
    await ChainCleaner.clean()
    await createBlockSyncTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public async currentBlockNumber() {
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

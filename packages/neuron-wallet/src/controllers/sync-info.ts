import BlockNumber from 'services/sync/block-number'
import { ResponseCode } from 'utils/const'

export default class SyncInfoController {
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

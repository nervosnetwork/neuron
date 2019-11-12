import { Cell } from 'types/cell-types'
import CellsService from '../services/cells'
import { ServiceHasNoResponse } from 'exceptions'
import { ResponseCode } from 'utils/const'
import AddressesService from 'services/addresses'
import LockUtils from 'models/lock-utils'

export default class DaoController {
  public static async getDaoCells(
    params: Controller.Params.GetDaoCellsParams
  ): Promise<Controller.Response<Cell[]>> {
    const { walletID } = params
    const addresses = (await AddressesService.allAddressesByWalletId(walletID)).map(addr => addr.address)
    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript())
    .addressesToAllLockHashes(addresses)
    const cells = await CellsService.getDaoCells(lockHashes)

    if (!cells) {
      throw new ServiceHasNoResponse('DaoCells')
    }

    return {
      status: ResponseCode.Success,
      result: cells,
    }
  }
}

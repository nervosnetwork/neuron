import { Cell, OutPoint, TransactionWithoutHash } from 'types/cell-types'
import { ServiceHasNoResponse, IsRequired } from 'exceptions'
import { ResponseCode } from 'utils/const'
import WalletsService from 'services/wallets'
import AddressesService from 'services/addresses'
import CellsService from 'services/cells'
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

  public static async generateDepositTx(params: {
    walletID: string,
    capacity: string,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.generateDepositTx(
      params.walletID,
      params.capacity,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public static async generateDepositAllTx(params: {
    walletID: string,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.generateDepositAllTx(
      params.walletID,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public static async startWithdrawFromDao(params: {
    walletID: string,
    outPoint: OutPoint,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.startWithdrawFromDao(
      params.walletID,
      params.outPoint,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public static async withdrawFromDao(params: {
    walletID: string,
    depositOutPoint: OutPoint,
    withdrawingOutPoint: OutPoint,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }
    const walletsService = WalletsService.getInstance()
    const tx = await walletsService.withdrawFromDao(
      params.walletID,
      params.depositOutPoint,
      params.withdrawingOutPoint,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }
}

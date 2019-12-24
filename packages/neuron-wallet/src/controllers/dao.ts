import { Cell, OutPoint, TransactionWithoutHash } from 'types/cell-types'
import { ServiceHasNoResponse, IsRequired } from 'exceptions'
import { ResponseCode } from 'utils/const'
import AddressesService from 'services/addresses'
import CellsService from 'services/cells'
import LockUtils from 'models/lock-utils'
import TransactionSender from 'services/transaction-sender'

export default class DaoController {
  public async getDaoCells(params: Controller.Params.GetDaoCellsParams): Promise<Controller.Response<Cell[]>> {
    const { walletID } = params
    const addresses = AddressesService.allAddressesByWalletId(walletID).map(addr => addr.address)
    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)
    const cells = await CellsService.getDaoCells(lockHashes)

    if (!cells) {
      throw new ServiceHasNoResponse('DaoCells')
    }

    return {
      status: ResponseCode.Success,
      result: cells,
    }
  }

  public async generateDepositTx(params: { walletID: string, capacity: string, fee: string, feeRate: string }):
    Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().generateDepositTx(
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

  public async generateDepositAllTx(params: { walletID: string, fee: string, feeRate: string }):
    Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().generateDepositAllTx(
      params.walletID,
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async startWithdrawFromDao(params: { walletID: string, outPoint: OutPoint, fee: string, feeRate: string }):
    Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().startWithdrawFromDao(
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

  public async withdrawFromDao(params: { walletID: string, depositOutPoint: OutPoint, withdrawingOutPoint: OutPoint, fee: string, feeRate: string }):
    Promise<Controller.Response<TransactionWithoutHash>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().withdrawFromDao(
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

import AddressService from "services/addresses"
import CellsService, { PaginationResult } from "services/cells"
import Cell from 'models/chain/output'
import { ServiceHasNoResponse } from "exceptions"
import { ResponseCode } from "utils/const"
import Transaction from "models/chain/transaction"
import TransactionSender from "services/transaction-sender"

export default class SingleMultiSignController {
  public async getSingleMultiSignCells(
    params: Controller.Params.GetSingleMultiSignCellsParams
  ): Promise<Controller.Response<PaginationResult<Cell>>> {
    const blake160s = AddressService.allAddressesByWalletId(params.walletID)
      .map(addr => addr.blake160)

    const result = await CellsService.getSingleMultiSignCells(blake160s, params.pageNo, params.pageSize)

    if (!result) {
      throw new ServiceHasNoResponse('MultiSignCells')
    }

    return {
      status: ResponseCode.Success,
      result,
    }
  }

  public async generateWithdrawMultiSignTx(
    params: Controller.Params.GenerateWithdrawMultiSignTxParams
  ): Promise<Controller.Response<Transaction>> {
    const tx = await new TransactionSender().generateWithdrawMultiSignTx(
      params.walletID,
      params.outPoint,
      params.fee,
      params.feeRate
    )

    if (!tx) {
      throw new ServiceHasNoResponse('GenerateWithdrawMultiSignTx')
    }

    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }
}

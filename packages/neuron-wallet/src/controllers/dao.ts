import { type OutPoint as OutPointSDK } from '@ckb-lumos/lumos'
import { ServiceHasNoResponse, IsRequired } from '../exceptions'
import { ResponseCode } from '../utils/const'
import CellsService from '../services/cells'
import TransactionSender from '../services/transaction-sender'
import OutPoint from '../models/chain/out-point'
import Cell from '../models/chain/output'
import Transaction from '../models/chain/transaction'

export default class DaoController {
  public async getDaoCells(params: Controller.Params.GetDaoCellsParams): Promise<Controller.Response<Cell[]>> {
    const { walletID } = params
    const cells = await CellsService.getDaoCells(walletID)

    if (!cells) {
      throw new ServiceHasNoResponse('DaoCells')
    }

    return {
      status: ResponseCode.Success,
      result: cells,
    }
  }

  public async generateDepositTx(params: {
    walletID: string
    capacity: string
    fee: string
    feeRate: string
  }): Promise<Controller.Response<Transaction>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().generateDepositTx(
      params.walletID,
      params.capacity,
      params.fee,
      params.feeRate
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async generateDepositAllTx(params: {
    walletID: string
    isBalanceReserved: boolean
    fee: string
    feeRate: string
  }): Promise<Controller.Response<Transaction>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().generateDepositAllTx(
      params.walletID,
      params.isBalanceReserved,
      params.fee,
      params.feeRate
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async startWithdrawFromDao(params: {
    walletID: string
    outPoint: OutPointSDK
    fee: string
    feeRate: string
  }): Promise<Controller.Response<Transaction>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().startWithdrawFromDao(
      params.walletID,
      OutPoint.fromSDK(params.outPoint),
      params.fee,
      params.feeRate
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async withdrawFromDao(params: {
    walletID: string
    depositOutPoint: OutPointSDK
    withdrawingOutPoint: OutPointSDK
    fee: string
    feeRate: string
  }): Promise<Controller.Response<Transaction>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().withdrawFromDao(
      params.walletID,
      OutPoint.fromSDK(params.depositOutPoint),
      OutPoint.fromSDK(params.withdrawingOutPoint),
      params.fee,
      params.feeRate
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async calculateUnlockDaoMaximumWithdraw(unlockHash: string): Promise<Controller.Response<string>> {
    const depositAndWithdrawInfo = await CellsService.getDaoWithdrawAndDeposit(unlockHash)
    let total = BigInt(0)
    for (let index = 0; index < depositAndWithdrawInfo.length; index++) {
      total =
        total +
        (await new TransactionSender().calculateDaoMaximumWithdraw(
          depositAndWithdrawInfo[index].depositOutPoint,
          depositAndWithdrawInfo[index].withdrawBlockHash
        ))
    }
    return {
      status: ResponseCode.Success,
      result: total.toString(),
    }
  }
}

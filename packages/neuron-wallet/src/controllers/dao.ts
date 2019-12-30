import { ServiceHasNoResponse, IsRequired } from 'exceptions'
import { ResponseCode } from 'utils/const'
import AddressesService from 'services/addresses'
import CellsService from 'services/cells'
import LockUtils from 'models/lock-utils'
import TransactionSender from 'services/transaction-sender'
import { OutputInterface } from 'models/chain/output'
import { TransactionWithoutHashInterface } from 'models/chain/transaction'
import OutPoint, { OutPointInterface } from 'models/chain/out-point'

export default class DaoController {
  public async getDaoCells(params: Controller.Params.GetDaoCellsParams): Promise<Controller.Response<OutputInterface[]>> {
    const { walletID } = params
    const addresses = AddressesService.allAddressesByWalletId(walletID).map(addr => addr.address)
    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)
    const cells = await CellsService.getDaoCells(lockHashes)

    if (!cells) {
      throw new ServiceHasNoResponse('DaoCells')
    }

    return {
      status: ResponseCode.Success,
      result: cells.map(c => c.toInterface()),
    }
  }

  public async generateDepositTx(params: { walletID: string, capacity: string, fee: string, feeRate: string }):
    Promise<Controller.Response<TransactionWithoutHashInterface>> {
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
      result: tx.toInterface(),
    }
  }

  public async generateDepositAllTx(params: { walletID: string, fee: string, feeRate: string }):
    Promise<Controller.Response<TransactionWithoutHashInterface>> {
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
      result: tx.toInterface(),
    }
  }

  public async startWithdrawFromDao(params: { walletID: string, outPoint: OutPointInterface, fee: string, feeRate: string }):
    Promise<Controller.Response<TransactionWithoutHashInterface>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().startWithdrawFromDao(
      params.walletID,
      new OutPoint(params.outPoint),
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx.toInterface(),
    }
  }

  public async withdrawFromDao(params: {
    walletID: string,
    depositOutPoint: OutPointInterface,
    withdrawingOutPoint: OutPointInterface,
    fee: string, feeRate: string
  }): Promise<Controller.Response<TransactionWithoutHashInterface>> {
    if (!params) {
      throw new IsRequired('Parameters')
    }

    const tx = await new TransactionSender().withdrawFromDao(
      params.walletID,
      new OutPoint(params.depositOutPoint),
      new OutPoint(params.withdrawingOutPoint),
      params.fee,
      params.feeRate,
    )
    return {
      status: ResponseCode.Success,
      result: tx.toInterface(),
    }
  }
}

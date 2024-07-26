import AssetAccountInfo from '../models/asset-account-info'
import Transaction from '../models/chain/transaction'
import { ServiceHasNoResponse } from '../exceptions'
import { ResponseCode, UDTType } from '../utils/const'
import AnyoneCanPayService from '../services/anyone-can-pay'
import TransactionSender from '../services/transaction-sender'
import { set as setDescription } from '../services/tx/transaction-description'
import AddressParser from '../models/address-parser'

export interface GenerateAnyoneCanPayTxParams {
  walletID: string
  address: string
  amount: string
  assetAccountID: number
  feeRate: string
  fee: string
  description?: string
}

export interface SendAnyoneCanPayTxParams {
  walletID: string
  tx: Transaction
  password: string
  skipLastInputs?: boolean
  amendHash?: string
}

export default class AnyoneCanPayController {
  public async generateTx(params: GenerateAnyoneCanPayTxParams): Promise<Controller.Response<Transaction>> {
    const tx = await AnyoneCanPayService.generateAnyoneCanPayTx(
      params.walletID,
      params.address,
      params.amount,
      params.assetAccountID,
      params.feeRate,
      params.fee,
      params.description
    )

    if (!tx) {
      throw new ServiceHasNoResponse('AnyoneCanPay')
    }

    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async getHoldSudtCellCapacity(
    receiveAddress: string,
    tokenID: string,
    udtType?: UDTType
  ): Promise<Controller.Response<string | undefined>> {
    const lockScript = AddressParser.parse(receiveAddress)
    const extraCKB = await AnyoneCanPayService.getHoldSUDTCellCapacity(lockScript, tokenID, udtType)
    return {
      status: ResponseCode.Success,
      result: extraCKB,
    }
  }

  public async sendTx(params: SendAnyoneCanPayTxParams, skipSign = false): Promise<Controller.Response<string>> {
    const txModel = Transaction.fromObject(params.tx)
    const txHash = await new TransactionSender().sendTx(
      params.walletID,
      txModel,
      params.password,
      params?.skipLastInputs ?? true,
      skipSign,
      params?.amendHash
    )

    if (!txHash) {
      throw new ServiceHasNoResponse('AnyoneCanPay')
    }

    const description = txModel.description
    if (description !== '') {
      await setDescription(params.walletID, txHash, description)
    }

    return {
      status: ResponseCode.Success,
      result: txHash,
    }
  }

  public getScript() {
    return {
      status: ResponseCode.Success,
      result: new AssetAccountInfo().infos.anyoneCanPay,
    }
  }

  public async generateSudtMigrateAcpTx(params: { outPoint: CKBComponents.OutPoint; acpAddress?: string }) {
    const tx = await AnyoneCanPayService.generateSudtMigrateAcpTx(params.outPoint, params.acpAddress)
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }
}

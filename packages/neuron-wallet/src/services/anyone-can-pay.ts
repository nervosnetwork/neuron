import AssetAccountInfo from "models/asset-account-info"
import AddressParser from "models/address-parser"
import { TransactionGenerator } from "./tx"
import { getConnection } from "typeorm"
import Output from "models/chain/output"
import LiveCell from "models/chain/live-cell"
import Transaction from "models/chain/transaction"
import AssetAccountEntity from "database/chain/entities/asset-account"
import { TargetOutputNotFoundError } from "exceptions"
import { AcpSendSameAccountError } from "exceptions"
import Script from "models/chain/script"
import LiveCellService from "./live-cell-service"
import WalletService from "./wallets"

export default class AnyoneCanPayService {
  public static async generateAnyoneCanPayTx(
    walletID: string,
    targetAddress: string,
    capacityOrAmount: string,
    assetAccountID: number,
    feeRate: string = '0',
    fee: string = '0',
    description?: string,
  ): Promise<Transaction> {
    const assetAccount = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .where({
        id: assetAccountID,
      })
      .getOne()
    if (!assetAccount) {
      throw new Error(`Asset Account not found!`)
    }
    const tokenID = assetAccount.tokenID

    const targetAnyoneCanPayLockScript = AddressParser.parse(targetAddress)
    if (assetAccount.blake160 === targetAnyoneCanPayLockScript.args) {
      throw new AcpSendSameAccountError()
    }

    const assetAccountInfo = new AssetAccountInfo()
    // verify targetAnyoneCanPay codeHash & hashType
    if (!assetAccountInfo.isAnyoneCanPayScript(targetAnyoneCanPayLockScript)) {
      throw new Error(`Invalid anyone-can-pay lock script address`)
    }

    const isCKB = !tokenID || tokenID === 'CKBytes'

    const anyoneCanPayLocks: Script[] = [assetAccountInfo.generateAnyoneCanPayScript(assetAccount.blake160)]

    const liveCellService = LiveCellService.getInstance();

    // find target output
    const targetOutputLiveCell: LiveCell | null = await liveCellService.getOneByLockScriptAndTypeScript(
      targetAnyoneCanPayLockScript,
      isCKB ? null : assetAccountInfo.generateSudtScript(tokenID)
    )

    if (!targetOutputLiveCell) {
      throw new TargetOutputNotFoundError()
    }

    if (isCKB && targetOutputLiveCell.type()) {
      throw new TargetOutputNotFoundError()
    }

    const targetOutput: Output = Output.fromObject({
      capacity: targetOutputLiveCell.capacity,
      lock: targetOutputLiveCell.lock(),
      type: targetOutputLiveCell.type(),
      data: targetOutputLiveCell.data,
      outPoint: targetOutputLiveCell.outPoint(),
    })

    const wallet = WalletService.getInstance().get(walletID)
    const changeBlake160: string = (await wallet.getNextChangeAddressByWalletId())!.blake160

    const tx = isCKB ? await TransactionGenerator.generateAnyoneCanPayToCKBTx(
      walletID,
      anyoneCanPayLocks,
      targetOutput,
      capacityOrAmount,
      changeBlake160,
      feeRate,
      fee
    ) : await TransactionGenerator.generateAnyoneCanPayToSudtTx(
      walletID,
      anyoneCanPayLocks,
      targetOutput,
      capacityOrAmount,
      changeBlake160,
      feeRate,
      fee
    )

    tx.description = description || ''

    return tx
  }
}

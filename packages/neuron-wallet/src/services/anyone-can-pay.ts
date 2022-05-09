import AssetAccountInfo from 'models/asset-account-info'
import AddressParser from 'models/address-parser'
import { TransactionGenerator } from './tx'
import { getConnection } from 'typeorm'
import Output from 'models/chain/output'
import LiveCell from 'models/chain/live-cell'
import Transaction from 'models/chain/transaction'
import AssetAccountEntity from 'database/chain/entities/asset-account'
import { TargetOutputNotFoundError } from 'exceptions'
import { AcpSendSameAccountError } from 'exceptions'
import Script from 'models/chain/script'
import OutPoint from 'models/chain/out-point'
import LiveCellService from './live-cell-service'
import WalletService from './wallets'
import SystemScriptInfo from 'models/system-script-info'
import CellsService from './cells'

export default class AnyoneCanPayService {
  public static async generateAnyoneCanPayTx(
    walletID: string,
    targetAddress: string,
    capacityOrAmount: string,
    assetAccountID: number,
    feeRate: string = '0',
    fee: string = '0',
    description?: string
  ): Promise<Transaction> {
    const assetAccount = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .where({
        id: assetAccountID
      })
      .getOne()
    if (!assetAccount) {
      throw new Error(`Asset Account not found!`)
    }
    const tokenID = assetAccount.tokenID

    const targetLockScript = AddressParser.parse(targetAddress)
    if (assetAccount.blake160 === targetLockScript.args) {
      throw new AcpSendSameAccountError()
    }

    const assetAccountInfo = new AssetAccountInfo()

    const isCKB = !tokenID || tokenID === 'CKBytes'

    const anyoneCanPayLocks: Script[] = [assetAccountInfo.generateAnyoneCanPayScript(assetAccount.blake160)]

    const liveCellService = LiveCellService.getInstance()

    // find target output
    const targetOutputLiveCell: LiveCell | null = await liveCellService.getOneByLockScriptAndTypeScript(
      targetLockScript,
      isCKB ? null : assetAccountInfo.generateSudtScript(tokenID)
    )

    let targetOutput: Output

    if (isCKB && targetOutputLiveCell?.type()) {
      throw new TargetOutputNotFoundError()
    }

    if (SystemScriptInfo.isSecpScript(targetLockScript)) {
      targetOutput = Output.fromObject({
        capacity: '0',
        lock: targetLockScript,
        type: null
      })
    } else {
      if (!targetOutputLiveCell) {
        throw new TargetOutputNotFoundError()
      }
      targetOutput = Output.fromObject({
        capacity: targetOutputLiveCell.capacity,
        lock: targetOutputLiveCell.lock(),
        type: targetOutputLiveCell.type(),
        data: targetOutputLiveCell.data,
        outPoint: targetOutputLiveCell.outPoint()
      })
    }

    const wallet = WalletService.getInstance().get(walletID)
    const changeBlake160: string = (await wallet.getNextChangeAddress())!.blake160

    const method = isCKB
      ? TransactionGenerator.generateAnyoneCanPayToCKBTx
      : TransactionGenerator.generateAnyoneCanPayToSudtTx

    const tx = await method(walletID, anyoneCanPayLocks, targetOutput, capacityOrAmount, changeBlake160, feeRate, fee)
    tx.description = description || ''

    return tx
  }

  public static async generateSudtMigrateAcpTx(outPoint: CKBComponents.OutPoint, acpAddress?: string) {
    const sudtLiveCell = await CellsService.getLiveCell(OutPoint.fromSDK(outPoint))
    if (!sudtLiveCell) {
      throw new Error('sudt live cell not found')
    }

    return await TransactionGenerator.generateSudtMigrateAcpTx(sudtLiveCell, acpAddress)
  }
}

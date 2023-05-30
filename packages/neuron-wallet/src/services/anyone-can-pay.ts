import AssetAccountInfo from '../models/asset-account-info'
import AddressParser from '../models/address-parser'
import { TransactionGenerator } from './tx'
import { getConnection } from 'typeorm'
import Output from '../models/chain/output'
import LiveCell from '../models/chain/live-cell'
import Transaction from '../models/chain/transaction'
import AssetAccountEntity from '../database/chain/entities/asset-account'
import {
  LightClientNotSupportSendToACPError,
  TargetLockError,
  TargetOutputNotFoundError,
  AcpSendSameAccountError,
} from '../exceptions'
import Script from '../models/chain/script'
import OutPoint from '../models/chain/out-point'
import LiveCellService from './live-cell-service'
import WalletService from './wallets'
import SystemScriptInfo from '../models/system-script-info'
import CellsService from './cells'
import { MIN_SUDT_CAPACITY } from '../utils/const'
import NetworksService from './networks'
import { NetworkType } from '../models/network'

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
        id: assetAccountID,
      })
      .getOne()
    if (!assetAccount) {
      throw new Error(`Asset Account not found!`)
    }

    const targetLockScript = AddressParser.parse(targetAddress)
    if (assetAccount.blake160 === targetLockScript.args) {
      throw new AcpSendSameAccountError()
    }

    const assetAccountInfo = new AssetAccountInfo()

    const tokenID = assetAccount.tokenID
    const isCKB = !tokenID || tokenID === 'CKBytes'

    const anyoneCanPayLocks: Script[] = [assetAccountInfo.generateAnyoneCanPayScript(assetAccount.blake160)]

    const targetOutput = isCKB
      ? await AnyoneCanPayService.getCKBTargetOutput(targetLockScript)
      : await AnyoneCanPayService.getSUDTTargetOutput(targetLockScript, tokenID)

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

  private static async getCKBTargetOutput(lockScript: Script) {
    if (SystemScriptInfo.isSecpScript(lockScript)) {
      return Output.fromObject({
        capacity: '0',
        lock: lockScript,
        type: null,
      })
    }
    const liveCellService = LiveCellService.getInstance()
    const targetOutputLiveCell: LiveCell | null = await liveCellService.getOneByLockScriptAndTypeScript(
      lockScript,
      null
    )
    if (new AssetAccountInfo().isAnyoneCanPayScript(lockScript)) {
      if (!targetOutputLiveCell) {
        if (NetworksService.getInstance().getCurrent().type === NetworkType.Light) {
          throw new LightClientNotSupportSendToACPError()
        }
        throw new TargetOutputNotFoundError()
      }
      return Output.fromObject({
        capacity: targetOutputLiveCell.capacity,
        lock: targetOutputLiveCell.lock(),
        type: targetOutputLiveCell.type(),
        data: targetOutputLiveCell.data,
        outPoint: targetOutputLiveCell.outPoint(),
      })
    }
    throw new TargetLockError()
  }

  private static async getSUDTTargetOutput(lockScript: Script, tokenID: string) {
    if (SystemScriptInfo.isSecpScript(lockScript)) {
      return Output.fromObject({
        capacity: BigInt(MIN_SUDT_CAPACITY).toString(),
        lock: lockScript,
        type: new AssetAccountInfo().generateSudtScript(tokenID),
      })
    }
    const liveCellService = LiveCellService.getInstance()
    const targetOutputLiveCell: LiveCell | null = await liveCellService.getOneByLockScriptAndTypeScript(
      lockScript,
      new AssetAccountInfo().generateSudtScript(tokenID)
    )
    if (targetOutputLiveCell && new AssetAccountInfo().isAnyoneCanPayScript(lockScript)) {
      return Output.fromObject({
        capacity: targetOutputLiveCell.capacity,
        lock: targetOutputLiveCell.lock(),
        type: targetOutputLiveCell.type(),
        data: targetOutputLiveCell.data,
        outPoint: targetOutputLiveCell.outPoint(),
      })
    }

    return Output.fromObject({
      capacity: AnyoneCanPayService.getSUDTAddCapacity(lockScript.args),
      lock: lockScript,
      type: new AssetAccountInfo().generateSudtScript(tokenID),
    })
  }

  private static getSUDTAddCapacity(args: string) {
    const addArgsLength = BigInt(args.slice(2).length / 2 - 20) * BigInt(10 ** 8)
    return (addArgsLength + BigInt(MIN_SUDT_CAPACITY)).toString()
  }

  public static async getHoldSUDTCellCapacity(lockScript: Script, tokenID: string) {
    if (SystemScriptInfo.isSecpScript(lockScript) || tokenID === 'CKBytes') {
      return undefined
    }
    const liveCellService = LiveCellService.getInstance()
    const targetOutputLiveCell: LiveCell | null = await liveCellService.getOneByLockScriptAndTypeScript(
      lockScript,
      new AssetAccountInfo().generateSudtScript(tokenID)
    )
    if (targetOutputLiveCell && new AssetAccountInfo().isAnyoneCanPayScript(lockScript)) {
      return undefined
    }
    return AnyoneCanPayService.getSUDTAddCapacity(lockScript.args)
  }
}

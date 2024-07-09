import { scriptToAddress } from '../utils/scriptAndAddress'
import AssetAccount from '../models/asset-account'
import Transaction from '../models/chain/transaction'
import AssetAccountService from '../services/asset-account-service'
import { ServiceHasNoResponse } from '../exceptions'
import { ResponseCode, UDTType } from '../utils/const'
import NetworksService from '../services/networks'
import AssetAccountInfo from '../models/asset-account-info'
import TransactionSender from '../services/transaction-sender'
import { dialog } from 'electron'
import { t } from 'i18next'
import { TransactionGenerator } from '../services/tx'
import OutPoint from '../models/chain/out-point'
import SudtTokenInfoService from '../services/sudt-token-info'

export interface GenerateCreateAssetAccountTxParams {
  walletID: string
  tokenID: string
  accountName: string
  tokenName: string
  symbol: string
  decimal: string
  feeRate: string
  fee: string
  udtType?: UDTType
}

export interface SendCreateAssetAccountTxParams {
  walletID: string
  assetAccount: AssetAccount
  tx: Transaction
  password: string
}

export interface UpdateAssetAccountParams {
  id: number
  accountName?: string
  tokenName?: string
  symbol?: string
  decimal?: string
}

export interface MigrateACPParams {
  id: string
  password: string
}

export interface GenerateCreateChequeTxParams {
  walletID: string
  assetAccountID: number
  address: string
  amount: string
  fee: string
  feeRate: string
  description?: string
}

export interface GenerateClaimChequeTxParams {
  walletID: string
  chequeCellOutPoint: OutPoint
}

export interface GenerateWithdrawChequeTxParams {
  walletID: string
  chequeCellOutPoint: OutPoint
}

export default class AssetAccountController {
  public async getAll(params: {
    walletID: string
  }): Promise<Controller.Response<(AssetAccount & { address: string })[]>> {
    const assetAccountInfo = new AssetAccountInfo()

    const assetAccounts = await AssetAccountService.getAll(params.walletID)

    if (!assetAccounts) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    const isMainnet = NetworksService.getInstance().isMainnet()

    const result = assetAccounts.map(aa => {
      return {
        ...aa,
        address: scriptToAddress(assetAccountInfo.generateAnyoneCanPayScript(aa.blake160), isMainnet),
      }
    })

    return {
      status: ResponseCode.Success,
      result,
    }
  }

  public async destroyAssetAccount(params: {
    walletID: string
    id: number
  }): Promise<Controller.Response<Transaction>> {
    const account = await AssetAccountService.getAccount(params)

    if (!account) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    const { tx } = await AssetAccountService.destroyAssetAccount(params.walletID, account)

    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async getAccount(params: {
    walletID: string
    id: number
  }): Promise<Controller.Response<AssetAccount & { address: string }>> {
    const account = await AssetAccountService.getAccount(params)

    if (!account) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    const assetAccountInfo = new AssetAccountInfo()
    const isMainnet = NetworksService.getInstance().isMainnet()

    return {
      status: ResponseCode.Success,
      result: {
        ...account,
        address: scriptToAddress(assetAccountInfo.generateAnyoneCanPayScript(account.blake160), isMainnet),
      },
    }
  }

  public async generateCreateTx(params: GenerateCreateAssetAccountTxParams): Promise<
    Controller.Response<{
      assetAccount: AssetAccount
      tx: Transaction
    }>
  > {
    const result = await AssetAccountService.generateCreateTx(params)

    if (!result) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    return {
      status: ResponseCode.Success,
      result,
    }
  }

  public async sendCreateTx(
    params: SendCreateAssetAccountTxParams,
    skipSign = false
  ): Promise<Controller.Response<string>> {
    const tx = Transaction.fromObject(params.tx)
    const assetAccount = AssetAccount.fromObject(params.assetAccount)
    const txHash = await AssetAccountService.sendTx(params.walletID, assetAccount, tx, params.password, skipSign)

    if (!txHash) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    return {
      status: ResponseCode.Success,
      result: txHash,
    }
  }

  public async update(params: UpdateAssetAccountParams) {
    await AssetAccountService.update(params.id, params)

    return {
      status: ResponseCode.Success,
      result: undefined,
    }
  }

  public async getTokenInfoList() {
    const result = await SudtTokenInfoService.getAllSudtTokenInfo()
    return {
      status: ResponseCode.Success,
      result,
    }
  }

  public async migrateAcp(params: MigrateACPParams): Promise<Controller.Response<string>> {
    const tx = await TransactionGenerator.generateMigrateLegacyACPTx(params.id)

    const txHash = await new TransactionSender().sendTx(params.id, tx!, params.password)

    const I18N_PATH = `messageBox.acp-migration-completed`

    dialog.showMessageBox({
      type: 'info',
      buttons: ['ok'].map(label => t(`${I18N_PATH}.buttons.${label}`)),
      defaultId: 1,
      title: t(`${I18N_PATH}.title`),
      message: t(`${I18N_PATH}.message`),
      cancelId: 0,
      noLink: true,
    })

    return {
      status: ResponseCode.Success,
      result: txHash,
    }
  }

  public async generateCreateChequeTx(params: GenerateCreateChequeTxParams): Promise<Controller.Response<Transaction>> {
    const tx = await AssetAccountService.generateCreateChequeTx(
      params.walletID,
      params.assetAccountID,
      params.address,
      params.amount,
      params.fee,
      params.feeRate,
      params.description
    )
    return {
      status: ResponseCode.Success,
      result: tx,
    }
  }

  public async generateClaimChequeTx(
    params: GenerateClaimChequeTxParams
  ): Promise<Controller.Response<{ tx: Transaction; assetAccount?: AssetAccount }>> {
    const { walletID, chequeCellOutPoint } = params
    const { tx, assetAccount } = await AssetAccountService.generateClaimChequeTx(walletID, chequeCellOutPoint)
    return {
      status: ResponseCode.Success,
      result: { tx, assetAccount },
    }
  }

  public async generateWithdrawChequeTx(
    params: GenerateWithdrawChequeTxParams
  ): Promise<Controller.Response<{ tx: Transaction }>> {
    const { chequeCellOutPoint } = params
    const tx = await AssetAccountService.generateWithdrawChequeTx(chequeCellOutPoint)
    return {
      status: ResponseCode.Success,
      result: { tx },
    }
  }
}

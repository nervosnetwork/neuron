import fs from 'fs'
import { dialog } from 'electron'
import { t } from 'i18next'
import { ResponseCode } from 'utils/const'
import OfflineSign, { SignType, OfflineSignJSON, SignStatus } from 'models/offline-sign'
import TransactionSender from 'services/transaction-sender'
import Transaction from 'models/chain/transaction'
import AssetAccountController from './asset-account'
import AnyoneCanPayController from './anyone-can-pay'
import WalletsController from './wallets'

export default class OfflineSignController {
  public async exportTransactionAsJSON ({ transaction, type, status, asset_account }: OfflineSignJSON) {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: t('offline-signature.export-transaction-as-json'),
        defaultPath: `transaction_${Date.now()}.json`
      })

      if (canceled || !filePath) {
        return
      }

      const signer = OfflineSign.fromJSON({
        transaction,
        type,
        status,
        asset_account,
      })

      fs.writeFileSync(filePath, JSON.stringify(signer.toJSON()))

      dialog.showMessageBox({
        type: 'info',
        message: t('offline-signature.transaction-exported', { filePath })
      })

      return {
        status: ResponseCode.Success
      }
    } catch (err) {
      dialog.showErrorBox(t('common.error'), err.message)
      throw err
    }
  }

  public async signTransaction (params: OfflineSignJSON & { walletID: string, password: string }) {
    const { transaction, type, walletID, password } = params
    const tx = await new TransactionSender().sign(walletID, Transaction.fromObject(transaction), password, type === SignType.SendSUDT ? 1 : 0)

    const signer = OfflineSign.fromJSON({
      ...params,
      transaction: tx
    })

    signer.setStatus(SignStatus.Signed)

    return {
      status: ResponseCode.Success,
      result: signer.toJSON()
    }
  }

  public async signAndExportTransaction (params: OfflineSignJSON & { walletID: string, password: string }) {
    const res = await this.signTransaction(params)

    const signer = OfflineSign.fromJSON({
      ...params,
      transaction: res.result.transaction
    })

    return await this.exportTransactionAsJSON(signer.toJSON())
  }

  public async broadcastTransaction ({
    transaction,
    type,
    asset_account: assetAccount,
    walletID
  }: OfflineSignJSON & { walletID: string }) {
    const tx = Transaction.fromObject(transaction)
    switch (type) {
      case SignType.CreateSUDTAccount: {
        return new AssetAccountController().sendCreateTx({
          walletID,
          assetAccount: assetAccount!,
          tx,
          password: ''
        }, true)
      }
      case SignType.SendSUDT: {
        return new AnyoneCanPayController().sendTx({
          walletID,
          tx,
          password: ''
        }, true)
      }
      default: {
        return new WalletsController().sendTx({
          walletID,
          tx,
          password: ''
        }, true)
      }
    }
  }
}

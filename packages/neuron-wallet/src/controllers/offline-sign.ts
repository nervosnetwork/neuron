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
import NodeService from 'services/node'
import { OfflineSignFailed, SaveOfflineJSONFailed } from 'exceptions'

export default class OfflineSignController {
  public async exportTransactionAsJSON ({ transaction, type, status, asset_account, description, context }: OfflineSignJSON) {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: t('offline-signature.export-transaction-as-json'),
      defaultPath: `transaction_${Date.now()}.json`
    })

    if (canceled || !filePath) {
      throw new SaveOfflineJSONFailed()
    }

    const tx = Transaction.fromObject(transaction)
    const { ckb } = NodeService.getInstance()

    if (context === undefined) {
      const rawTx = ckb.rpc.paramsFormatter.toRawTransaction(tx.toSDKRawTransaction())
      const txs = await Promise.all(rawTx.inputs.map(i => ckb.rpc.getTransaction(i.previous_output!.tx_hash)))
      context = txs.map(i => ckb.rpc.paramsFormatter.toRawTransaction(i.transaction))
    }

    const signer = OfflineSign.fromJSON({
      transaction,
      type,
      status,
      asset_account,
      context,
      description
    })

    const json = signer.toJSON()

    fs.writeFileSync(filePath, JSON.stringify(json))

    dialog.showMessageBox({
      type: 'info',
      message: t('offline-signature.transaction-exported', { filePath })
    })

    return {
      status: ResponseCode.Success,
      result: json
    }
  }

  public async signTransaction (params: OfflineSignJSON & { walletID: string, password: string }) {
    const { transaction, type, walletID, password, context } = params

    try {
      const tx = await new TransactionSender().sign(
        walletID,
        Transaction.fromObject(transaction),
        password,
        type === SignType.SendSUDT ? 1 : 0,
        context
      )

      const signer = OfflineSign.fromJSON({
        ...params,
        transaction: tx
      })

      signer.setStatus(SignStatus.Signed)

      return {
        status: ResponseCode.Success,
        result: signer.toJSON()
      }
    } catch (err) {
      if (err.code) {
        throw err
      }
      throw new OfflineSignFailed()
    }
  }

  public async signAndExportTransaction (params: OfflineSignJSON & { walletID: string, password: string }) {
    const res = await this.signTransaction(params)

    const signer = OfflineSign.fromJSON({
      ...params,
      ...res.result
    })

    return await this.exportTransactionAsJSON(signer.toJSON())
  }

  public async broadcastTransaction ({
    transaction,
    type,
    asset_account: assetAccount,
    walletID,
    description
  }: OfflineSignJSON & { walletID: string }) {
    const tx = Transaction.fromObject(transaction)
    switch (type) {
      case SignType.CreateSUDTAccount: {
        return new AssetAccountController().sendCreateTx({
          walletID,
          assetAccount: assetAccount!,
          tx,
          password: '',
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
          password: '',
          description
        }, true)
      }
    }
  }
}

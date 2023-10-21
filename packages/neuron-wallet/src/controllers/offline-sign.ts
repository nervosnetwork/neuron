import fs from 'fs'
import path from 'path'
import { dialog } from 'electron'
import { t } from 'i18next'
import { ResponseCode } from '../utils/const'
import OfflineSign, { SignType, OfflineSignJSON, SignStatus } from '../models/offline-sign'
import TransactionSender from '../services/transaction-sender'
import Transaction from '../models/chain/transaction'
import AssetAccountController from './asset-account'
import AnyoneCanPayController from './anyone-can-pay'
import WalletsController from './wallets'
import NodeService from '../services/node'
import { MultisigNotSignedNeedError, OfflineSignFailed } from '../exceptions'
import MultisigConfigModel from '../models/multisig-config'
import { getMultisigStatus } from '../utils/multisig'
import { generateRPC } from '../utils/ckb-rpc'
import ShowGlobalDialogSubject from '../models/subjects/show-global-dialog'

export default class OfflineSignController {
  public async exportTransactionAsJSON({
    transaction,
    type,
    status,
    asset_account,
    description,
    context,
  }: OfflineSignJSON) {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: t('offline-signature.export-transaction'),
      defaultPath: `transaction_${Date.now()}.json`,
    })

    if (canceled || !filePath) {
      return {
        status: ResponseCode.Success,
      }
    }

    const tx = Transaction.fromObject(transaction)
    const rpc = generateRPC(NodeService.getInstance().nodeUrl)

    if (context === undefined) {
      const rawSdkTx = tx.toSDKRawTransaction()
      const rawTx = rpc.paramsFormatter.toRawTransaction(rawSdkTx)
      const txs = await Promise.all(rawTx.inputs.map(i => rpc.getTransaction(i.previous_output!.tx_hash)))
      context = txs.map(i => rpc.paramsFormatter.toRawTransaction(i.transaction))
    }

    const signer = OfflineSign.fromJSON({
      transaction,
      type,
      status,
      asset_account,
      context,
      description,
    })

    const json = signer.toJSON()

    fs.writeFileSync(filePath, JSON.stringify(json))

    ShowGlobalDialogSubject.next({
      type: 'success',
      message: t('offline-signature.transaction-exported', { filePath }),
    })

    return {
      status: ResponseCode.Success,
      result: {
        filePath: path.basename(filePath),
        json,
      },
    }
  }

  public async signTransaction(
    params: OfflineSignJSON & {
      walletID: string
      password: string
      multisigConfig?: MultisigConfigModel
    }
  ) {
    const { transaction, type, walletID, password, context } = params

    try {
      let tx: Transaction
      if (params.multisigConfig) {
        tx = await new TransactionSender().signMultisig(
          walletID,
          Transaction.fromObject(transaction),
          password,
          [params.multisigConfig],
          context
        )
      } else {
        tx = await new TransactionSender().sign(
          walletID,
          Transaction.fromObject(transaction),
          password,
          type === SignType.SendSUDT,
          context
        )
      }

      const signer = OfflineSign.fromJSON({
        ...params,
        transaction: tx,
      })

      let signStatus = SignStatus.Signed
      if (params.multisigConfig) {
        signStatus = getMultisigStatus(params.multisigConfig, params.transaction.signatures)
      }
      signer.setStatus(signStatus)

      return {
        status: ResponseCode.Success,
        result: signer.toJSON(),
      }
    } catch (err) {
      if (err.code) {
        throw err
      }
      throw new OfflineSignFailed()
    }
  }

  public async signAndExportTransaction(
    params: OfflineSignJSON & { walletID: string; password: string; multisigConfig?: MultisigConfigModel }
  ) {
    const res = await this.signTransaction(params)

    const signer = OfflineSign.fromJSON({
      ...params,
      ...res.result,
    })

    return await this.exportTransactionAsJSON(signer.toJSON())
  }

  public async signAndBroadcastTransaction(
    params: OfflineSignJSON & { walletID: string; password: string; multisigConfig?: MultisigConfigModel }
  ) {
    const res = await this.signTransaction(params)
    if (res.result.status !== SignStatus.Signed) {
      throw new MultisigNotSignedNeedError()
    }

    return await this.broadcastTransaction({
      ...res.result,
      walletID: params.walletID,
    })
  }

  public async broadcastTransaction({
    transaction,
    type,
    asset_account: assetAccount,
    walletID,
    description,
  }: OfflineSignJSON & { walletID: string }) {
    const tx = Transaction.fromObject(transaction)
    switch (type) {
      case SignType.CreateSUDTAccount: {
        return new AssetAccountController().sendCreateTx(
          {
            walletID,
            assetAccount: assetAccount!,
            tx,
            password: '',
          },
          true
        )
      }
      case SignType.SendSUDT: {
        return new AnyoneCanPayController().sendTx(
          {
            walletID,
            tx,
            password: '',
          },
          true
        )
      }
      default: {
        return new WalletsController().sendTx(
          {
            walletID,
            tx,
            password: '',
            description,
          },
          true
        )
      }
    }
  }
}

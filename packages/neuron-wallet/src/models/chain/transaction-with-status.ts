import { CKBComponents } from '@ckb-lumos/lumos/rpc'
import Transaction from './transaction'
import TxStatus from './tx-status'

type APITransactionWithStatus = CKBComponents.TransactionWithStatus

export default class TransactionWithStatus {
  public transaction: Transaction
  public txStatus: TxStatus
  public cycles: APITransactionWithStatus['cycles']

  constructor(transaction: Transaction, txStatus: TxStatus, cycles: APITransactionWithStatus['cycles']) {
    this.transaction = transaction
    this.txStatus = txStatus
    this.cycles = cycles
  }

  public static fromSDK(txWithStatus: APITransactionWithStatus): TransactionWithStatus {
    return new TransactionWithStatus(
      Transaction.fromSDK(txWithStatus.transaction),
      TxStatus.fromSDK(txWithStatus.txStatus),
      txWithStatus.cycles
    )
  }
}

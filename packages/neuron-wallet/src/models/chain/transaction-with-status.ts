import Transaction from './transaction'
import TxStatus from './tx-status'

export default class TransactionWithStatus {
  public transaction: Transaction
  public txStatus: TxStatus

  constructor(transaction: Transaction, txStatus: TxStatus) {
    this.transaction = transaction
    this.txStatus = txStatus
  }

  public static fromSDK(txWithStatus: CKBComponents.TransactionWithStatus): TransactionWithStatus {
    return new TransactionWithStatus(
      Transaction.fromSDK(txWithStatus.transaction),
      TxStatus.fromSDK(txWithStatus.txStatus)
    )
  }
}

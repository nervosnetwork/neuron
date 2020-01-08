import Transaction from './transaction'
import TxStatus from './tx-status'

export default class TransactionWithStatus {
  constructor(
    public transaction: Transaction,
    public txStatus: TxStatus
  ) {}

  public static fromSDK(txWithStatus: CKBComponents.TransactionWithStatus): TransactionWithStatus {
    return new TransactionWithStatus(
      Transaction.fromSDK(txWithStatus.transaction),
      TxStatus.fromSDK(txWithStatus.txStatus)
    )
  }
}

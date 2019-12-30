import { TransactionInterface, Transaction } from './transaction'
import { TxStatusInterface, TxStatus } from './tx-status'

export interface TransactionWithStatusInterface {
  transaction: TransactionInterface
  txStatus: TxStatusInterface
}

export class TransactionWithStatus implements TransactionWithStatusInterface {
  private _transaction: Transaction
  private _txStatus: TxStatus

  constructor({ transaction, txStatus }: TransactionWithStatusInterface) {
    this._transaction = transaction instanceof Transaction ? transaction : new Transaction(transaction)
    this._txStatus = txStatus instanceof TxStatus ? txStatus : new TxStatus(txStatus)
  }

  public get transaction(): Transaction {
    return this._transaction
  }

  public get txStatus(): TxStatus {
    return this._txStatus
  }


  public static fromSDK(txWithStatus: CKBComponents.TransactionWithStatus): TransactionWithStatus {
    return new TransactionWithStatus({
      transaction: Transaction.fromSDK(txWithStatus.transaction),
      txStatus: TxStatus.fromSDK(txWithStatus.txStatus)
    })
  }
}

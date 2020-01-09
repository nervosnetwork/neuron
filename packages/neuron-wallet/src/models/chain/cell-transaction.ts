import TransactionPoint from './transaction-point'

export default class CellTransaction {
  public createdBy: TransactionPoint
  public consumedBy: TransactionPoint | null

  constructor(createdBy: TransactionPoint, consumedBy: TransactionPoint | null) {
    this.createdBy = createdBy
    this.consumedBy = consumedBy
  }

  public static fromSDK(cellTx: CKBComponents.TransactionByLockHash): CellTransaction {
    return new CellTransaction(
      TransactionPoint.fromSDK(cellTx.createdBy),
      cellTx.consumedBy ? TransactionPoint.fromSDK(cellTx.consumedBy) : cellTx.consumedBy
    )
  }
}

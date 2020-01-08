import TransactionPoint from './transaction-point'

export default class CellTransaction {
  constructor(
    public createdBy: TransactionPoint,
    public consumedBy: TransactionPoint | null
  ) {}

  public static fromSDK(cellTx: CKBComponents.TransactionByLockHash): CellTransaction {
    return new CellTransaction(
      TransactionPoint.fromSDK(cellTx.createdBy),
      cellTx.consumedBy ? TransactionPoint.fromSDK(cellTx.consumedBy) : cellTx.consumedBy
    )
  }
}

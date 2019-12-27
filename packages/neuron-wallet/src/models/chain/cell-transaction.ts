import { TransactionPointInterface, TransactionPoint } from './transaction-point'

export interface CellTransactionInterface {
  createdBy: TransactionPointInterface
  consumedBy: TransactionPointInterface | null
}

export class CellTransaction implements CellTransactionInterface {
  private _createdBy: TransactionPoint
  private _consumedBy: TransactionPoint | null

  constructor({ createdBy, consumedBy }: CellTransactionInterface) {
    this._createdBy = createdBy.constructor.name === 'Object' ? new TransactionPoint(createdBy) : (createdBy as TransactionPoint)
    this._consumedBy = consumedBy ? (consumedBy.constructor.name === 'Object' ? new TransactionPoint(consumedBy) : (consumedBy as TransactionPoint)) : consumedBy
  }

  public get createdBy(): TransactionPoint {
    return this._createdBy
  }

  public get consumedBy(): TransactionPoint | null {
    return this._consumedBy
  }

  public static fromSDK(cellTx: CKBComponents.TransactionByLockHash): CellTransaction {
    return new CellTransaction({
      createdBy: TransactionPoint.fromSDK(cellTx.createdBy),
      consumedBy: cellTx.consumedBy ? TransactionPoint.fromSDK(cellTx.consumedBy) : cellTx.consumedBy
    })
  }
}

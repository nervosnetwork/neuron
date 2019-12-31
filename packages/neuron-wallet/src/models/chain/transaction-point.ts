import TypeChecker from "utils/type-checker"

export interface TransactionPointInterface {
  blockNumber: string
  txHash: string
  index: string
}

export class TransactionPoint implements TransactionPointInterface {
  private _blockNumber: string
  private _txHash: string
  private _index: string

  constructor({ blockNumber, txHash, index }: TransactionPointInterface) {
    this._blockNumber = BigInt(blockNumber).toString()
    this._txHash = txHash
    this._index = (+index).toString()

    TypeChecker.hashChecker(this._txHash)
    TypeChecker.numberChecker(this._blockNumber, this._index)
  }

  public get blockNumber(): string {
    return this._blockNumber
  }

  public get txHash(): string {
    return this._txHash
  }

  public get index(): string {
    return this._index
  }

  public static fromSDK(txPoint: CKBComponents.TransactionPoint): TransactionPoint {
    return new TransactionPoint({
      blockNumber: txPoint.blockNumber,
      txHash: txPoint.txHash,
      index: txPoint.index,
    })
  }
}

import TypeChecker from "utils/type-checker"

export default class TransactionPoint {
  constructor(
    public blockNumber: string,
    public txHash: string,
    public index: string
  ) {
    this.blockNumber = BigInt(blockNumber).toString()
    this.index = (+index).toString()

    TypeChecker.hashChecker(this.txHash)
    TypeChecker.numberChecker(this.blockNumber, this.index)
  }

  public static fromSDK(txPoint: CKBComponents.TransactionPoint): TransactionPoint {
    return new TransactionPoint(
      txPoint.blockNumber,
      txPoint.txHash,
      txPoint.index
    )
  }
}

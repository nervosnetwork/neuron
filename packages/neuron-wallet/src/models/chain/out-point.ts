import HexUtils from 'utils/hex'
import TypeChecker from 'utils/type-checker'

export default class OutPoint {
  // check hex string
  constructor(
    public txHash: string,
    public index: string
  ) {
    this.index = (+index).toString()

    TypeChecker.hashChecker(this.txHash)
    TypeChecker.numberChecker(this.index)
  }

  public toSDK(): CKBComponents.OutPoint {
    return {
      txHash: this.txHash,
      index: HexUtils.toHex(this.index)
    }
  }

  public static fromSDK(outPoint: CKBComponents.OutPoint): OutPoint {
    return new OutPoint(
      outPoint.txHash,
      outPoint.index,
    )
  }
}

import HexUtils from 'utils/hex'
import TypeChecker from 'utils/type-checker'

export default class OutPoint {
  public txHash: string
  public index: string

  // check hex string
  constructor(txHash: string, index: string) {
    this.txHash = txHash
    this.index = (+index).toString()

    TypeChecker.hashChecker(this.txHash)
    TypeChecker.numberChecker(this.index)
  }

  public static fromObject({ txHash, index}: { txHash: string, index: string }): OutPoint {
    return new OutPoint(txHash, index)
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

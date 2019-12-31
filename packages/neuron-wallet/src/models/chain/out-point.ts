import HexUtils from 'utils/hex'
import TypeChecker from 'utils/type-checker'

export interface OutPointInterface {
  txHash: string
  index: string
}

export class OutPoint implements OutPointInterface {
  private _txHash: string
  private _index: string

  // check hex string
  constructor({ txHash, index }: OutPointInterface) {
    this._txHash = txHash
    this._index = (+index).toString()

    TypeChecker.hashChecker(this._txHash)
    TypeChecker.numberChecker(this._index)
  }

  public get txHash(): string {
    return this._txHash
  }

  public get index(): string {
    return this._index
  }

  public toInterface(): OutPointInterface {
    return {
      txHash: this.txHash,
      index: this.index,
    }
  }

  public toSDK(): CKBComponents.OutPoint {
    return {
      txHash: this.txHash,
      index: HexUtils.toHex(this.index)
    }
  }

  public static fromSDK(sdkOutPoint: CKBComponents.OutPoint): OutPoint {
    return new OutPoint({
      txHash: sdkOutPoint.txHash,
      index: sdkOutPoint.index,
    })
  }
}

export default OutPoint

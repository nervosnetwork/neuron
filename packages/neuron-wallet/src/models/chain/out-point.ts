import HexUtils from "utils/hex"

export interface OutPointInterface {
  txHash: string
  index: string
}

export default class OutPoint implements OutPointInterface {
  private _txHash: string
  private _index: string

  // check hex string
  constructor({ txHash, index }: OutPointInterface) {
    this._txHash = txHash
    this._index = (+index).toString()
  }

  public get txHash(): string {
    return this._txHash
  }

  public get index(): string {
    return this._index
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

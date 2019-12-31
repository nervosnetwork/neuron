import TypeCheckerUtils from "utils/type-checker"

export enum TxStatusType {
  Pending = 'pending',
  Proposed = 'proposed',
  Committed = 'committed',
}

export interface TxStatusInterface {
  blockHash: string | null
  status: TxStatusType
}

export class TxStatus implements TxStatusInterface {
  private _blockHash: string | null
  private _status: TxStatusType

  constructor({ blockHash, status }: TxStatusInterface) {
    this._blockHash = blockHash
    this._status = status

    TypeCheckerUtils.hashChecker(this._blockHash)
  }

  public get blockHash(): string | null {
    return this._blockHash
  }

  public get status(): TxStatusType {
    return this._status
  }

  public toSDK() {
    return {
      blockHash: this.blockHash,
      status: this.status,
    }
  }

  public static fromSDK(txStatus: any): TxStatus {
    return new TxStatus({
      blockHash: txStatus.blockHash,
      status: txStatus.status as TxStatusType
    })
  }
}

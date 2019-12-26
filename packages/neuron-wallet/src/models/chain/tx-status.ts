type TxStatusType = 'pending' | 'proposed' | 'committed'

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
  }

  public get blockHash(): string | null {
    return this._blockHash
  }

  public get status(): TxStatusType {
    return this._status
  }
}

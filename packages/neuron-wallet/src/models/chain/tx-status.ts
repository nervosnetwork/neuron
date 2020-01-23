import TypeCheckerUtils from "utils/type-checker"

export enum TxStatusType {
  Pending = 'pending',
  Proposed = 'proposed',
  Committed = 'committed',
}

export default class TxStatus {
  public blockHash: string | null
  public status: TxStatusType

  constructor(blockHash: string | null, status: TxStatusType) {
    this.blockHash = blockHash
    this.status = status
    TypeCheckerUtils.hashChecker(this.blockHash)
  }

  public isPending(): boolean {
    return this.status === TxStatusType.Pending
  }

  public isProposed(): boolean {
    return this.status === TxStatusType.Proposed
  }

  public isCommitted(): boolean {
    return this.status === TxStatusType.Committed
  }

  public toSDK() {
    return {
      blockHash: this.blockHash,
      status: this.status,
    }
  }

  public static fromSDK(txStatus: any): TxStatus {
    return new TxStatus(
      txStatus.blockHash,
      txStatus.status as TxStatusType
    )
  }
}

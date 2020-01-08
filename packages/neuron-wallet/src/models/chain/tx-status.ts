import TypeCheckerUtils from "utils/type-checker"

export enum TxStatusType {
  Pending = 'pending',
  Proposed = 'proposed',
  Committed = 'committed',
}

export default class TxStatus {
  constructor(
    public blockHash: string | null,
    public status: TxStatusType
  ) {
    TypeCheckerUtils.hashChecker(this.blockHash)
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

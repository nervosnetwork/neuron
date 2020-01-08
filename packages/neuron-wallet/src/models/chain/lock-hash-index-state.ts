import TypeChecker from "utils/type-checker"

export default class LockHashIndexState {
  constructor(
    public lockHash: string,
    public blockNumber: string,
    public blockHash: string
  ) {
    this.blockNumber = BigInt(blockNumber).toString()

    TypeChecker.hashChecker(this.lockHash, this.blockHash)
    TypeChecker.numberChecker(this.blockNumber)
  }

  public static fromSDK(state: CKBComponents.LockHashIndexState): LockHashIndexState {
    return new LockHashIndexState(
      state.lockHash,
      state.blockNumber,
      state.blockHash,
    )
  }
}

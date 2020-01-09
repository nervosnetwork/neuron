import TypeChecker from "utils/type-checker"

export default class LockHashIndexState {
  public lockHash: string
  public blockNumber: string
  public blockHash: string

  constructor(lockHash: string, blockNumber: string, blockHash: string) {
    this.lockHash = lockHash
    this.blockNumber = BigInt(blockNumber).toString()
    this.blockHash = blockHash

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

import TypeChecker from "utils/type-checker"

export interface LockHashIndexStateInterface {
  lockHash: string
  blockNumber: string
  blockHash: string
}

export class LockHashIndexState implements LockHashIndexStateInterface {
  private _lockHash: string
  private _blockNumber: string
  private _blockHash: string

  constructor({ lockHash, blockNumber, blockHash }: LockHashIndexStateInterface) {
    this._lockHash = lockHash
    this._blockNumber = BigInt(blockNumber).toString()
    this._blockHash = blockHash

    TypeChecker.hashChecker(this._lockHash, this._blockHash)
    TypeChecker.numberChecker(this._blockNumber)
  }

  public get lockHash(): string {
    return this._lockHash
  }

  public get blockNumber(): string {
    return this._blockNumber
  }

  public get blockHash(): string {
    return this._blockHash
  }

  public static fromSDK(state: CKBComponents.LockHashIndexState): LockHashIndexState {
    return new LockHashIndexState({
      lockHash: state.lockHash,
      blockNumber: state.blockNumber,
      blockHash: state.blockHash,
    })
  }
}

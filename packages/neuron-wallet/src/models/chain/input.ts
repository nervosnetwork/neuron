import OutPoint from './out-point'
import Script from './script'
import HexUtils from 'utils/hex'
import TypeChecker from 'utils/type-checker'

export default class Input {
  // don't using = directly, using setXxx instead
  // check hex string
  constructor(
    public previousOutput: OutPoint | null,
    public since?: string,
    public capacity?: string | null,
    public lock?: Script | null,
    public lockHash?: string | null,
    public inputIndex?: string | null
  ) {
    this.since = since ? BigInt(since).toString() : since
    this.capacity = capacity ? BigInt(capacity).toString() : capacity
    this.inputIndex = inputIndex ? (+inputIndex).toString() : undefined

    this.lockHash = lockHash || this.lock?.computeHash()

    TypeChecker.hashChecker(this.lockHash)
    TypeChecker.numberChecker(this.since, this.capacity, this.inputIndex)
  }

  public setCapacity(value: string) {
    this.capacity = BigInt(value).toString()
  }

  public setLock(value: Script) {
    this.lock = value
    this.lockHash = this.lock.computeHash()
  }

  public setInputIndex(value: string) {
    this.inputIndex = BigInt(value).toString()
  }

  public toSDK(): CKBComponents.CellInput {
    return {
      since: HexUtils.toHex(this.since!),
      previousOutput: this.previousOutput?.toSDK() || null
    }
  }

  public static fromSDK(input: CKBComponents.CellInput): Input {
    return new Input(
      input.previousOutput ? OutPoint.fromSDK(input.previousOutput) : null,
      input.since,
    )
  }
}

import OutPoint from './out-point'
import Script from './script'
import HexUtils from 'utils/hex'
import TypeChecker from 'utils/type-checker'

export default class Input {
  public previousOutput: OutPoint | null
  public since?: string
  public capacity?: string | null
  public lock?: Script | null
  public lockHash?: string | null
  public inputIndex?: string | null

  // don't using = directly, using setXxx instead
  // check hex string
  constructor(
    previousOutput: OutPoint | null,
    since?: string,
    capacity?: string | null,
    lock?: Script | null,
    lockHash?: string | null,
    inputIndex?: string | null
  ) {
    this.previousOutput = previousOutput
    this.since = since ? BigInt(since).toString() : since
    this.capacity = capacity ? BigInt(capacity).toString() : capacity
    this.lock = lock
    this.inputIndex = inputIndex ? (+inputIndex).toString() : undefined

    this.lockHash = lockHash || this.lock?.computeHash()

    TypeChecker.hashChecker(this.lockHash)
    TypeChecker.numberChecker(this.since, this.capacity, this.inputIndex)
  }

  public static fromObject({ previousOutput, since, capacity, lock, inputIndex }: {
    previousOutput: OutPoint | null,
    since?: string,
    capacity?: string | null,
    lock?: Script | null,
    lockHash?: string | null,
    inputIndex?: string | null
  }): Input {
    return new Input(
      previousOutput ? OutPoint.fromObject(previousOutput) : previousOutput,
      since,
      capacity,
      lock ? Script.fromObject(lock) : lock,
      inputIndex,
    )
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

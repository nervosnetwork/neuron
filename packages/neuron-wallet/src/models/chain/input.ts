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
  public multiSignBlake160?: string | null
  public type?: Script | null
  public typeHash?: string | null
  public data?: string | null

  // don't using = directly, using setXxx instead
  // check hex string
  constructor(
    previousOutput: OutPoint | null,
    since?: string,
    capacity?: string | null,
    lock?: Script | null,
    lockHash?: string | null,
    inputIndex?: string | null,
    multiSignBlake160?: string | null,
    type?: Script | null,
    typeHash?: string | null,
    data?: string | null,
  ) {
    this.previousOutput = previousOutput
    this.since = since ? BigInt(since).toString() : since
    this.capacity = capacity ? BigInt(capacity).toString() : capacity
    this.lock = lock
    this.inputIndex = inputIndex ? (+inputIndex).toString() : undefined
    this.multiSignBlake160 = multiSignBlake160

    this.lockHash = lockHash || this.lock?.computeHash()

    this.type = type
    this.typeHash = typeHash || this.type?.computeHash()

    this.data = data

    TypeChecker.hashChecker(this.lockHash, this.typeHash)
    TypeChecker.numberChecker(this.since, this.capacity, this.inputIndex)
  }

  public static fromObject({ previousOutput, since, capacity, lock, lockHash, inputIndex, multiSignBlake160, type, typeHash, data }: {
    previousOutput: OutPoint | null,
    since?: string,
    capacity?: string | null,
    lock?: Script | null,
    lockHash?: string | null,
    inputIndex?: string | null,
    multiSignBlake160?: string | null,
    type?: Script | null,
    typeHash?: string | null,
    data?: string | null,
  }): Input {
    return new Input(
      previousOutput ? OutPoint.fromObject(previousOutput) : previousOutput,
      since,
      capacity,
      lock ? Script.fromObject(lock) : lock,
      lockHash,
      inputIndex,
      multiSignBlake160,
      type ? Script.fromObject(type) : type,
      typeHash,
      data
    )
  }

  public setCapacity(value: string) {
    this.capacity = BigInt(value).toString()
  }

  public setLock(value: Script) {
    this.lock = value
    this.lockHash = this.lock.computeHash()
  }

  public setType(value: Script) {
    this.type = value
    this.typeHash = this.type.computeHash()
  }

  public setInputIndex(value: string) {
    this.inputIndex = BigInt(value).toString()
  }

  public setMultiSignBlake160(value: string) {
    this.multiSignBlake160 = value
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

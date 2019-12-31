import OutPoint, { OutPointInterface } from './out-point'
import { ScriptInterface, Script } from './script'
import HexUtils from 'utils/hex'
import TypeChecker from 'utils/type-checker'

export interface InputInterface {
  previousOutput: OutPointInterface | null
  since?: string
  capacity?: string | null
  lockHash?: string | null
  lock?: ScriptInterface | null
  inputIndex?: string
}

export class Input implements InputInterface {
  private _previousOutput: OutPoint | null
  private _since?: string
  private _capacity?: string | null
  private _lockHash?: string | null
  private _lock?: Script | null
  private _inputIndex?: string

  // check hex string
  constructor({ previousOutput, since, capacity, lock, inputIndex }: InputInterface) {
    this._since = since ? BigInt(since).toString() : since
    this._capacity = capacity ? BigInt(capacity).toString() : capacity
    this._inputIndex = inputIndex ? (+inputIndex).toString() : undefined

    this._previousOutput = previousOutput ? (previousOutput instanceof OutPoint ? previousOutput : new OutPoint(previousOutput)) : previousOutput
    this._lock = lock ? (lock instanceof Script ? lock : new Script(lock)) : lock
    this._lockHash = this._lock?.computeHash()

    TypeChecker.hashChecker(this._lockHash)
    TypeChecker.numberChecker(this._since, this._capacity, this._inputIndex)
  }

  public get previousOutput(): OutPoint | null {
    return this._previousOutput
  }

  public get since(): string | undefined {
    return this._since
  }

  public get capacity(): string | null | undefined {
    return this._capacity
  }

  public setCapacity(value: string) {
    this._capacity = BigInt(value).toString()
  }

  public get lockHash(): string | null | undefined {
    return this._lockHash
  }

  public get lock(): Script | null | undefined {
    return this._lock
  }

  public setLock(value: Script) {
    this._lock = value
    this._lockHash = this._lock.computeHash()
  }

  public get inputIndex(): string | undefined {
    return this._inputIndex
  }

  public setInputIndex(value: string) {
    this._inputIndex = BigInt(value).toString()
  }

  public toInterface(): InputInterface {
    return {
      previousOutput: this.previousOutput?.toInterface() || null,
      since: this.since,
      capacity: this.capacity,
      lockHash: this.lockHash,
      lock: this.lock?.toInterface(),
      inputIndex: this.inputIndex,
    }
  }

  public toSDK(): CKBComponents.CellInput {
    return {
      since: HexUtils.toHex(this.since!),
      previousOutput: this.previousOutput?.toSDK() || null
    }
  }

  public static fromSDK(input: CKBComponents.CellInput): Input {
    return new Input({
      since: input.since,
      previousOutput: input.previousOutput ? OutPoint.fromSDK(input.previousOutput) : null
    })
  }
}

export default Input



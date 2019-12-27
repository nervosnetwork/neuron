import OutPoint, { OutPointInterface } from './out-point'
import { ScriptInterface, Script } from './script'
import HexUtils from 'utils/hex'
import LockUtils from '../lock-utils'

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
    this._since = BigInt(since).toString()
    this._capacity = BigInt(capacity).toString()
    this._inputIndex = inputIndex ? (+inputIndex).toString() : undefined

    this._previousOutput = previousOutput?.constructor.name === 'Object' ? new OutPoint(previousOutput) : (previousOutput as OutPoint)
    this._lock = lock?.constructor.name === 'Object' ? new Script(lock) : (lock as Script)
    this._lockHash = this._lock ? LockUtils.computeScriptHash(this._lock) : undefined
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
    this._lockHash = LockUtils.computeScriptHash(this._lock)
  }

  public get inputIndex(): string | undefined {
    return this._inputIndex
  }

  public setInputIndex(value: string) {
    this._inputIndex = BigInt(value).toString()
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



import OutPoint, { OutPointInterface } from './out-point'
import { ScriptInterface, Script } from './script'

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
  constructor({ previousOutput, since, capacity, lockHash, lock, inputIndex }: InputInterface) {
    this._since = BigInt(since).toString()
    this._capacity = BigInt(capacity).toString()
    this._inputIndex = inputIndex ? (+inputIndex).toString() : undefined

    this._previousOutput = previousOutput?.constructor.name === 'Object' ? new OutPoint(previousOutput) : (previousOutput as OutPoint)
    this._lockHash = lockHash
    this._lock = lock?.constructor.name === 'Object' ? new Script(lock) : (lock as Script)
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

  public get lockHash(): string | null | undefined {
    return this._lockHash
  }

  public get lock(): Script | null | undefined {
    return this._lock
  }

  public get inputIndex(): string | undefined {
    return this._inputIndex
  }
}

export default Input



export interface WitnessArgsInterface {
  lock?: string
  inputType?: string
  outputType?: string
}

export class WitnessArgs implements WitnessArgsInterface {
  private _lock?: string
  private _inputType?: string
  private _outputType?: string

  public static EMPTY_LOCK = '0x' + '0'.repeat(130)

  constructor({ lock, inputType, outputType }: WitnessArgsInterface) {
    this._lock = lock
    this._inputType = inputType
    this._outputType = outputType
  }

  public get lock(): string | undefined {
    return this._lock
  }

  public get inputType(): string | undefined {
    return this._inputType
  }

  public get outputType(): string | undefined {
    return this._outputType
  }

  public setEmptyLock() {
    this._lock = WitnessArgs.EMPTY_LOCK
  }

  public static generateEmpty(): WitnessArgs {
    return new WitnessArgs({
      lock: undefined,
      inputType: undefined,
      outputType: undefined,
    })
  }

  public static emptyLock(): WitnessArgs {
    return new WitnessArgs({
      lock: WitnessArgs.EMPTY_LOCK,
      inputType: undefined,
      outputType: undefined,
    })
  }

  public toSDK(): CKBComponents.WitnessArgs {
    return {
      lock: this.lock,
      inputType: this.inputType,
      outputType: this.outputType,
    }
  }
}



export interface WitnessArgsInterface {
  lock?: string
  inputType?: string
  outputType?: string
}

export class WitnessArgs implements WitnessArgsInterface {
  private _lock?: string
  private _inputType?: string
  private _outputType?: string

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
}



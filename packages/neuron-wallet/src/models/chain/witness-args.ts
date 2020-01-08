export default class WitnessArgs {
  public static EMPTY_LOCK = '0x' + '0'.repeat(130)

  constructor(
    public lock?: string,
    public inputType?: string,
    public outputType?: string
  ) {
    this.outputType = outputType
  }

  public setEmptyLock() {
    this.lock = WitnessArgs.EMPTY_LOCK
  }

  public static generateEmpty(): WitnessArgs {
    return new WitnessArgs()
  }

  public static emptyLock(): WitnessArgs {
    return new WitnessArgs(
      WitnessArgs.EMPTY_LOCK,
      undefined,
      undefined,
    )
  }

  public toSDK(): CKBComponents.WitnessArgs {
    return {
      lock: this.lock,
      inputType: this.inputType,
      outputType: this.outputType,
    }
  }
}



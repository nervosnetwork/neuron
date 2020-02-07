export default class WitnessArgs {
  public static EMPTY_LOCK = '0x' + '0'.repeat(130)

  public lock?: string
  public inputType?: string
  public outputType?: string

  constructor(lock?: string, inputType?: string, outputType?: string) {
    this.lock = lock
    this.inputType = inputType
    this.outputType = outputType
  }

  public static fromObject({ lock, inputType, outputType }: {
    lock?: string,
    inputType?: string,
    outputType?: string
  }): WitnessArgs {
    return new WitnessArgs(lock, inputType, outputType)
  }

  public setEmptyLock() {
    this.lock = WitnessArgs.EMPTY_LOCK
  }

  public static deserialize(wit: string): WitnessArgs {
    const buffer = Buffer.from(wit.slice(2), 'hex')
    const size = buffer.slice(0, 4).readUInt32LE(0)
    const offset0 = buffer.readUInt32LE(4)
    const offset1 = buffer.readUInt32LE(8)
    const offset2 = buffer.readUInt32LE(12)

    const lockLength = buffer.readUInt32LE(offset0)
    const lock = '0x' + buffer.slice(offset0 + 4, offset1).toString('hex')
    const inputTypeLength = offset1 <= size - 4 ? buffer.readUInt32LE(offset1) : 0
    const inputType = '0x' + buffer.slice(offset1 + 4, offset2).toString('hex')
    const outputTypeLength = offset2 <= size - 4 ? buffer.readUInt32LE(offset2) : 0
    const outputType = '0x' + buffer.slice(offset2 + 4, size).toString('hex')

    if (
      buffer.length !== size ||
      lock.length !== lockLength * 2 + 2 ||
      inputType.length !== inputTypeLength * 2 + 2 ||
      outputType.length !== outputTypeLength * 2 + 2
    ) {
      throw new Error('Serialized witness format error!')
    }

    return WitnessArgs.fromObject({
      lock: '0x' + buffer.slice(offset0 + 4, offset1).toString('hex'),
      inputType: inputType === '0x' ? undefined : inputType,
      outputType: outputType === '0x' ? undefined : outputType
    })
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



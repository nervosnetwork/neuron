import { Cell, WitnessArgs } from 'types/cell-types'
import ConvertTo from 'types/convert-to'
import { serializeOutput, serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils/lib/serialization/transaction'
import HexUtils from 'utils/hex'
import { serializeFixVec } from '@nervosnetwork/ckb-sdk-utils/lib/serialization'

export default class TransactionSize {
  public static SERIALIZED_OFFSET_BYTESIZE = 4

  public static base(): number {
    return 68 + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  public static cellDep(): number {
    return 37
  }

  public static header(): number {
    return 32
  }

  public static input(): number {
    return 44
  }

  public static output(output: Cell): number {
    const sdkOutput = ConvertTo.toSdkOutput(output)
    const bytes = serializeOutput(sdkOutput)
    return Buffer.byteLength(HexUtils.removePrefix(bytes), 'hex') + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  public static witness(witness: WitnessArgs | string): number {
    const wit: string = typeof(witness) === 'string'
      ? witness
      : serializeWitnessArgs(ConvertTo.toSdkWitnessArgs(witness))
    const bytes = serializeFixVec(wit)
    return Buffer.byteLength(HexUtils.removePrefix(bytes), 'hex') + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }
}

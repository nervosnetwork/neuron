import { Cell, WitnessArgs, TransactionWithoutHash } from 'types/cell-types';
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

  public static headerDep(): number {
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

  public static outputData(data: string): number {
    const bytes = serializeFixVec(data)
    return Buffer.byteLength(HexUtils.removePrefix(bytes), 'hex') + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  public static witness(witness: WitnessArgs | string): number {
    const wit: string = typeof(witness) === 'string'
      ? witness
      : serializeWitnessArgs(ConvertTo.toSdkWitnessArgs(witness))
    const bytes = serializeFixVec(wit)
    return Buffer.byteLength(HexUtils.removePrefix(bytes), 'hex') + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  public static tx(tx: TransactionWithoutHash): number {
    return [
      this.base(),
      this.cellDep() * tx.cellDeps!.length,
      this.headerDep() * tx.headerDeps!.length,
      this.input() * tx.inputs!.length,
      ...tx.outputs!.map(o => this.output(o)),
      ...tx.outputsData!.map(data => this.outputData(data)),
      ...tx.witnesses!.map(wit => this.witness(wit)),
    ].reduce((result, c) => result + c, 0)
  }
}

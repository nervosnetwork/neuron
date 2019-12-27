import { serializeOutput, serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils/lib/serialization/transaction'
import HexUtils from 'utils/hex'
import { serializeFixVec } from '@nervosnetwork/ckb-sdk-utils/lib/serialization'
import Output from './chain/output'
import { WitnessArgs } from './chain/witness-args'
import { TransactionWithoutHash } from './chain/transaction'

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

  public static output(output: Output): number {
    const bytes = serializeOutput(output.toSDK())
    return HexUtils.byteLength(bytes) + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  public static outputData(data: string): number {
    const bytes = serializeFixVec(data)
    return HexUtils.byteLength(bytes) + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  public static witness(witness: WitnessArgs | string): number {
    const wit: string = typeof(witness) === 'string'
      ? witness
      : serializeWitnessArgs(witness.toSDK())
    const bytes = serializeFixVec(wit)
    return HexUtils.byteLength(bytes) + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  public static secpLockWitness(): number {
    const wit = new WitnessArgs({
      lock: '0x' + '0'.repeat(130),
      inputType: undefined,
      outputType: undefined,
    })
    return TransactionSize.witness(wit)
  }

  public static emptyWitness(): number {
    return TransactionSize.witness('0x')
  }

  public static tx(tx: TransactionWithoutHash): number {
    return [
      this.base(),
      this.cellDep() * tx.cellDeps.length,
      this.headerDep() * tx.headerDeps.length,
      this.input() * tx.inputs.length,
      ...tx.outputs.map(o => this.output(o)),
      ...tx.outputsData.map(data => this.outputData(data)),
      ...tx.witnesses.map(wit => this.witness(wit)),
    ].reduce((result, c) => result + c, 0)
  }
}

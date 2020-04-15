import { serializeOutput, serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils/lib/serialization/transaction'
import HexUtils from 'utils/hex'
import { serializeFixVec } from '@nervosnetwork/ckb-sdk-utils/lib/serialization'
import Output from './chain/output'
import WitnessArgs from './chain/witness-args'
import Transaction from './chain/transaction'
import MultiSign from './multi-sign'
import Script, { ScriptHashType } from './chain/script'
import BufferUtils from 'utils/buffer'

export default class  TransactionSize {
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

  public static ckbAnyoneCanPayOutput(): number {
    const hash32 = '0x' + '0'.repeat(64)
    const hash20 = '0x' + '0'.repeat(40)
    const sudtOutput = Output.fromObject({
      capacity: '61',
      lock: new Script(hash32, hash20, ScriptHashType.Type),
    })
    return TransactionSize.output(sudtOutput)
  }

  // TODO: refactor and use constant here
  public static sudtAnyoneCanPayOutput(): number {
    const hash32 = '0x' + '0'.repeat(64)
    const hash20 = '0x' + '0'.repeat(40)
    const sudtOutput = Output.fromObject({
      capacity: '142',
      lock: new Script(hash32, hash20, ScriptHashType.Type),
      type: new Script(hash32, hash32, ScriptHashType.Type),
    })
    return TransactionSize.output(sudtOutput)
  }

  public static outputData(data: string): number {
    const bytes = serializeFixVec(data)
    return HexUtils.byteLength(bytes) + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  // TODO: and here
  public static sudtData(): number {
    const data = BufferUtils.writeBigUInt128LE(BigInt(0))
    return TransactionSize.outputData(data)
  }

  public static witness(witness: WitnessArgs | string): number {
    const wit: string = typeof(witness) === 'string'
      ? witness
      : serializeWitnessArgs(witness.toSDK())
    const bytes = serializeFixVec(wit)
    return HexUtils.byteLength(bytes) + TransactionSize.SERIALIZED_OFFSET_BYTESIZE
  }

  public static secpLockWitness(): number {
    return TransactionSize.witness(WitnessArgs.emptyLock())
  }

  public static emptyWitness(): number {
    return TransactionSize.witness('0x')
  }

  public static singleMultiSignWitness(): number {
    const blake160 = '0x' + '0'.repeat(40)
    const lock = new MultiSign().serialize(blake160) + '0'.repeat(130)
    const wit = new WitnessArgs(lock)
    return TransactionSize.witness(wit)
  }

  public static tx(tx: Transaction): number {
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

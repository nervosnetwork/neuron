import Script, { ScriptHashType } from './script'
import OutPoint from './out-point'
import { LumosCell } from 'block-sync-renderer/sync/indexer-connector'

export default class LiveCell {
  public txHash: string
  public outputIndex: string
  public capacity: string
  public lockHash: string
  public lockHashType: string
  public lockCodeHash: string
  public lockArgs: string
  public typeHash?: string | null
  public typeHashType?: string | null
  public typeCodeHash?: string | null
  public typeArgs?: string | null
  public data: string

  constructor(txHash: string, outputIndex: string, capacity: string, lock: Script, type: Script | null, data: string) {
    this.txHash = txHash;
    this.outputIndex = BigInt(outputIndex).toString();
    this.capacity = BigInt(capacity).toString();
    this.lockHash = lock.computeHash();
    this.lockHashType = lock.hashType;
    this.lockCodeHash = lock.codeHash;
    this.lockArgs = lock.args;
    if (type) {
      this.typeHash = type.computeHash();
      this.typeHashType = type.hashType;
      this.typeCodeHash = type.codeHash;
      this.typeArgs = type.args;
    }
    this.data = data;
  }

  public outPoint(): OutPoint {
    return new OutPoint(this.txHash, this.outputIndex)
  }

  public lock(): Script {
    return new Script(this.lockCodeHash, this.lockArgs, this.lockHashType as ScriptHashType)
  }

  public type(): Script | undefined {
    if (this.typeCodeHash && this.typeArgs && this.typeHashType) {
      return new Script(this.typeCodeHash, this.typeArgs, this.typeHashType as ScriptHashType)
    }
    return undefined
  }

  public static fromLumos(cell: LumosCell): LiveCell {
    const type = cell.cell_output.type ? new Script(
      cell.cell_output.type.code_hash,
      cell.cell_output.type.args,
      cell.cell_output.type.hash_type === 'data' ? ScriptHashType.Data : ScriptHashType.Type,
    ) : null

    return new LiveCell(
      cell.out_point.tx_hash,
      cell.out_point.index,
      cell.cell_output.capacity,
      new Script(
        cell.cell_output.lock.code_hash,
        cell.cell_output.lock.args,
        cell.cell_output.lock.hash_type === 'data' ? ScriptHashType.Data : ScriptHashType.Type,
      ),
      type,
      cell.data ? cell.data : '0x'
    )
  }
}

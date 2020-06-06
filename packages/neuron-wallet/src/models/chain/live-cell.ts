import Script, { ScriptHashType } from './script'
import LiveCellEntity from 'database/chain/entities/live-cell'
import HexUtils from 'utils/hex'
import OutPoint from './out-point'

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

  public static fromEntity(entity: LiveCellEntity): LiveCell {
    const type = entity.typeCodeHash ? new Script(
      HexUtils.fromBuffer(entity.typeCodeHash),
      HexUtils.fromBuffer(entity.typeArgs!),
      entity.typeHashType === '1' ? ScriptHashType.Data : ScriptHashType.Type
    ) : null
    return new LiveCell(
      HexUtils.fromBuffer(entity.txHash),
      entity.outputIndex.toString(),
      entity.capacity,
      new Script(
        HexUtils.fromBuffer(entity.lockCodeHash),
        HexUtils.fromBuffer(entity.lockArgs),
        entity.lockHashType === '1' ? ScriptHashType.Data : ScriptHashType.Type,
      ),
      type,
      HexUtils.fromBuffer(entity.data)
    )
  }
}

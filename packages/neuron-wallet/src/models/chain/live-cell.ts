import OutPoint from './out-point'
import { LumosCell } from '../../block-sync-renderer/sync/connector'
import { HashType, Script, utils } from '@ckb-lumos/base'

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
    this.txHash = txHash
    this.outputIndex = BigInt(outputIndex).toString()
    this.capacity = BigInt(capacity).toString()
    this.lockHash = utils.computeScriptHash(lock)
    this.lockHashType = lock.hashType
    this.lockCodeHash = lock.codeHash
    this.lockArgs = lock.args
    if (type) {
      this.typeHash = utils.computeScriptHash(type)
      this.typeHashType = type.hashType
      this.typeCodeHash = type.codeHash
      this.typeArgs = type.args
    }
    this.data = data
  }

  public outPoint(): OutPoint {
    return new OutPoint(this.txHash, this.outputIndex)
  }

  public lock(): Script {
    return {
      codeHash: this.lockCodeHash,
      args: this.lockArgs,
      hashType: this.lockHashType as HashType,
    }
  }

  public type(): Script | undefined {
    if (this.typeCodeHash && this.typeArgs && this.typeHashType) {
      return {
        codeHash: this.typeCodeHash,
        args: this.typeArgs,
        hashType: this.typeHashType as HashType,
      }
    }
    return undefined
  }

  public static fromLumos(cell: LumosCell): LiveCell {
    const type = (cell.cellOutput.type as Script) || null

    return new LiveCell(
      cell.outPoint.txHash,
      cell.outPoint.index,
      cell.cellOutput.capacity,
      cell.cellOutput.lock as Script,
      type,
      cell.data ? cell.data : '0x'
    )
  }
}

import { Entity, BaseEntity, Column, PrimaryColumn } from 'typeorm'
import Script, { ScriptHashType } from 'models/chain/script'
import OutPoint from 'models/chain/out-point'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { OutputStatus } from 'models/chain/output'

@Entity()
export default class MultisigOutput extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar'
  })
  outPointTxHash!: string

  @PrimaryColumn({
    type: 'varchar'
  })
  outPointIndex!: string

  @PrimaryColumn({
    type: 'varchar'
  })
  outPointTxHashAddIndex!: string

  @Column({
    type: 'varchar'
  })
  capacity!: string

  @Column({
    type: 'varchar'
  })
  lockCodeHash!: string

  @Column({
    type: 'varchar'
  })
  lockArgs!: string

  @Column({
    type: 'varchar'
  })
  lockHashType!: ScriptHashType

  @Column({
    type: 'varchar'
  })
  lockHash!: string

  @Column({
    type: 'varchar'
  })
  status!: string

  public outPoint(): OutPoint {
    return new OutPoint(this.outPointTxHash, this.outPointIndex)
  }

  public lockScript(): Script {
    return new Script(this.lockCodeHash, this.lockArgs, this.lockHashType)
  }

  public static fromIndexer(params: {
    outPoint: { index: string; txHash: string }
    output: { capacity: string; lock: { args: string; codeHash: string; hashType: string } }
  }): MultisigOutput {
    const entity = new MultisigOutput()
    entity.outPointTxHash = params.outPoint.txHash
    entity.outPointIndex = params.outPoint.index
    entity.outPointTxHashAddIndex = params.outPoint.txHash + params.outPoint.index
    entity.capacity = BigInt(params.output.capacity).toString()
    entity.lockArgs = params.output.lock.args
    entity.lockCodeHash = params.output.lock.codeHash
    entity.lockHashType = params.output.lock.hashType as ScriptHashType
    entity.lockHash = scriptToHash({
      args: entity.lockArgs,
      codeHash: entity.lockCodeHash,
      hashType: entity.lockHashType
    })
    entity.status = OutputStatus.Live
    return entity
  }
}

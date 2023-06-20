import { Entity, BaseEntity, Column, PrimaryColumn } from 'typeorm'
import Script, { ScriptHashType } from '../../../models/chain/script'
import OutPoint from '../../../models/chain/out-point'
import { utils } from '@ckb-lumos/lumos'
import { OutputStatus } from '../../../models/chain/output'

@Entity()
export default class MultisigOutput extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  outPointTxHash!: string

  @PrimaryColumn({
    type: 'varchar',
  })
  outPointIndex!: string

  @PrimaryColumn({
    type: 'varchar',
  })
  outPointTxHashAddIndex!: string

  @Column({
    type: 'varchar',
  })
  capacity!: string

  @Column({
    type: 'varchar',
  })
  lockCodeHash!: string

  @Column({
    type: 'varchar',
  })
  lockArgs!: string

  @Column({
    type: 'varchar',
  })
  lockHashType!: ScriptHashType

  @Column({
    type: 'varchar',
  })
  lockHash!: string

  @Column({
    type: 'varchar',
  })
  status!: string

  public outPoint(): OutPoint {
    return new OutPoint(this.outPointTxHash, this.outPointIndex)
  }

  public lockScript(): Script {
    return new Script(this.lockCodeHash, this.lockArgs, this.lockHashType)
  }

  public static fromIndexer(params: {
    out_point: { index: string; tx_hash: string }
    output: { capacity: string; lock: { args: string; code_hash: string; hash_type: string } }
  }): MultisigOutput {
    const entity = new MultisigOutput()
    entity.outPointTxHash = params.out_point.tx_hash
    entity.outPointIndex = params.out_point.index
    entity.outPointTxHashAddIndex = params.out_point.tx_hash + params.out_point.index
    entity.capacity = BigInt(params.output.capacity).toString()
    entity.lockArgs = params.output.lock.args
    entity.lockCodeHash = params.output.lock.code_hash
    entity.lockHashType = params.output.lock.hash_type as ScriptHashType
    entity.lockHash = utils.computeScriptHash({
      args: entity.lockArgs,
      codeHash: entity.lockCodeHash,
      hashType: entity.lockHashType,
    })
    entity.status = OutputStatus.Live
    return entity
  }
}

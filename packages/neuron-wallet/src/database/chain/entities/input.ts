import { Entity, BaseEntity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import Transaction from './transaction'
import OutPoint from '../../../models/chain/out-point'
import InputModel from '../../../models/chain/input'
import Script, { ScriptHashType } from '../../../models/chain/script'

// cellbase input may have same OutPoint
@Entity()
export default class Input extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  // cellbase input has empty cell { txHash, index }
  @Column({
    type: 'varchar',
    nullable: true,
  })
  outPointTxHash: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  outPointIndex: string | null = null

  @Column({
    type: 'varchar',
  })
  since!: string

  @Column({
    type: 'varchar',
    nullable: true,
  })
  lockHash: string | null = null

  // cellbase input has no previous output lock script
  @Column({
    type: 'varchar',
    nullable: true,
  })
  lockCodeHash: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  lockArgs: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  lockHashType: ScriptHashType | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeCodeHash: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeArgs: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeHashType: ScriptHashType | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeHash: string | null = null

  // only first 130 chars
  @Column({
    type: 'varchar',
    default: '0x',
  })
  data: string = '0x'

  @Column({
    type: 'varchar',
  })
  transactionHash!: string

  @ManyToOne(_type => Transaction, transaction => transaction.inputs, { onDelete: 'CASCADE' })
  transaction!: Transaction

  @Column({
    type: 'varchar',
    nullable: true,
  })
  capacity: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  inputIndex: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  multiSignBlake160: string | null = null

  public previousOutput(): OutPoint | null {
    if (!this.outPointTxHash || !this.outPointIndex) {
      return null
    }
    return new OutPoint(this.outPointTxHash, this.outPointIndex)
  }

  public lockScript(): Script | undefined {
    if (this.lockCodeHash && this.lockArgs && this.lockHashType) {
      return new Script(this.lockCodeHash, this.lockArgs, this.lockHashType)
    }
    return undefined
  }

  public typeScript(): Script | undefined {
    if (this.typeCodeHash && this.typeArgs && this.typeHashType) {
      return new Script(this.typeCodeHash, this.typeArgs, this.typeHashType)
    }
    return undefined
  }

  public toModel(): InputModel {
    return new InputModel(
      this.previousOutput(),
      this.since,
      this.capacity,
      this.lockScript(),
      this.lockHash,
      this.inputIndex,
      this.multiSignBlake160,
      this.typeScript(),
      this.typeHash
    )
  }
}

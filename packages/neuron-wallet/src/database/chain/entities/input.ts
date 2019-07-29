import { Entity, BaseEntity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { OutPoint, Input as InputInterface, CellOutPoint, ScriptHashType } from '../../../types/cell-types'
import Transaction from './transaction'

/* eslint @typescript-eslint/no-unused-vars: "warn" */
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

  @ManyToOne(_type => Transaction, transaction => transaction.inputs, { onDelete: 'CASCADE' })
  transaction!: Transaction

  @Column({
    type: 'varchar',
    nullable: true,
  })
  capacity: string | null = null

  @Column({
    type: 'enum',
    enum: ScriptHashType,
    default: ScriptHashType.Data,
    nullable: false,
  })
  hashType: ScriptHashType = ScriptHashType.Data

  public cellOutPoint(): CellOutPoint | null {
    if (!this.outPointTxHash || !this.outPointIndex) {
      return null
    }
    return {
      txHash: this.outPointTxHash,
      index: this.outPointIndex,
      hashType: this.hashType,
    }
  }

  public previousOutput(): OutPoint {
    return {
      blockHash: null,
      cell: this.cellOutPoint(),
    }
  }

  public toInterface(): InputInterface {
    return {
      previousOutput: this.previousOutput(),
      capacity: this.capacity,
      lockHash: this.lockHash,
    }
  }
}

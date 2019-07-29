import { Entity, BaseEntity, Column, PrimaryColumn, ManyToOne } from 'typeorm'
import { Script, OutPoint, Cell, CellOutPoint, ScriptHashType } from '../../../types/cell-types'
import TransactionEntity from './transaction'

/* eslint @typescript-eslint/no-unused-vars: "warn" */
@Entity()
export default class Output extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  outPointTxHash!: string

  @PrimaryColumn({
    type: 'varchar',
  })
  outPointIndex!: string

  @Column({
    type: 'varchar',
  })
  capacity!: string

  @Column({
    type: 'simple-json',
  })
  lock!: Script

  @Column({
    type: 'varchar',
  })
  lockHash!: string

  @Column({
    type: 'varchar',
  })
  status!: string

  @Column({
    type: 'enum',
    enum: ScriptHashType,
    default: ScriptHashType.Data,
    nullable: false,
  })
  hashType!: ScriptHashType

  public cellOutPoint(): CellOutPoint {
    return {
      txHash: this.outPointTxHash,
      index: this.outPointIndex,
      hashType: this.hashType,
    }
  }

  public outPoint(): OutPoint {
    return {
      blockHash: null,
      cell: this.cellOutPoint(),
    }
  }

  @ManyToOne(_type => TransactionEntity, transaction => transaction.outputs, { onDelete: 'CASCADE' })
  transaction!: TransactionEntity

  public toInterface(): Cell {
    return {
      capacity: this.capacity,
      lock: this.lock,
      lockHash: this.lockHash,
      outPoint: this.outPoint(),
      status: this.status,
    }
  }
}

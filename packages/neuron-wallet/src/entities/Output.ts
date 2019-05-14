import { Entity, BaseEntity, Column, PrimaryColumn, ManyToOne } from 'typeorm'
import { Script, OutPoint, Cell } from '../appTypes/types'
import TransactionEntity from './Transaction'

/* eslint @typescript-eslint/no-unused-vars: "warn" */
@Entity()
export default class Output extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  outPointTxHash!: string

  @PrimaryColumn({
    type: 'int',
  })
  outPointIndex!: number

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

  public outPoint(): OutPoint {
    return {
      txHash: this.outPointTxHash,
      index: this.outPointIndex,
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

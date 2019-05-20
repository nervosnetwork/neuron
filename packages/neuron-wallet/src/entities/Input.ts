import { Entity, BaseEntity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { OutPoint, Input as InputInterface, CellOutPoint } from '../appTypes/types'
import Transaction from './Transaction'

/* eslint @typescript-eslint/no-unused-vars: "warn" */
// cellbase input may have same OutPoint
@Entity()
export default class Input extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar',
  })
  outPointTxHash!: string

  @Column({
    type: 'varchar',
  })
  outPointIndex!: string

  @Column({
    type: 'simple-json',
  })
  args!: string[]

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

  public cellOutPoint(): CellOutPoint {
    return {
      txHash: this.outPointTxHash,
      index: this.outPointIndex,
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
      args: this.args,
    }
  }
}

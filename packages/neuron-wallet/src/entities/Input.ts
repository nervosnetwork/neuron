import { Entity, BaseEntity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { OutPoint, Input as InputInterface } from '../appTypes/types'
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
  outPointIndex!: number

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

  public previousOutput(): OutPoint {
    return {
      txHash: this.outPointTxHash,
      index: this.outPointIndex,
    }
  }

  public toInterface(): InputInterface {
    return {
      previousOutput: this.previousOutput(),
      args: this.args,
    }
  }
}

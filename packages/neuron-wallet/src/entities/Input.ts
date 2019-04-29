import { Entity, BaseEntity, PrimaryColumn, Column, ManyToOne } from 'typeorm'
import { OutPoint } from '../services/cells'
import Transaction from './Transaction'
import { Input as InputInterface } from '../services/transactions'

/* eslint @typescript-eslint/no-unused-vars: "warn" */
@Entity()
export default class Input extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  outPointHash!: string

  @PrimaryColumn({
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

  @ManyToOne(_type => Transaction, transaction => transaction.inputs)
  transaction!: Transaction

  @Column({
    type: 'varchar',
    nullable: true,
  })
  capacity: string | null = null

  public previousOutput(): OutPoint {
    return {
      hash: this.outPointHash,
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

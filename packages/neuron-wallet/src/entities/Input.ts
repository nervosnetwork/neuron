import { Entity, BaseEntity, PrimaryColumn, Column, ManyToOne } from 'typeorm'
import { OutPoint } from '../services/cells'
import Transaction from './Transaction'

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

  public previousOutput(): OutPoint {
    return {
      hash: this.outPointHash,
      index: this.outPointIndex,
    }
  }
}

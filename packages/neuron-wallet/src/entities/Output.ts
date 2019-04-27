import { Entity, BaseEntity, Column, PrimaryColumn, ManyToOne } from 'typeorm'
import { Script, OutPoint } from '../services/cells'
import TransactionEntity from './Transaction'

/* eslint @typescript-eslint/no-unused-vars: "warn" */
@Entity()
export default class Output extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  outPointHash!: string

  @PrimaryColumn({
    type: 'int',
  })
  outPointIndex!: number

  @Column({
    type: 'varchar',
  })
  capacity!: string

  @Column({
    type: 'text',
  })
  data!: string

  @Column({
    type: 'simple-json',
  })
  lock!: Script

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  type: Script | null = null

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
      hash: this.outPointHash,
      index: this.outPointIndex,
    }
  }

  @ManyToOne(_type => TransactionEntity, transaction => transaction.outputs)
  transaction!: TransactionEntity
}

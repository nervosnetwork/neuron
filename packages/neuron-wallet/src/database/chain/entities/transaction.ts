import { Entity, BaseEntity, PrimaryColumn, Column, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm'
import { Witness, OutPoint, Transaction as TransactionInterface, TransactionStatus } from '../../../types/cell-types'
import InputEntity from './input'
import OutputEntity from './output'

/* eslint @typescript-eslint/no-unused-vars: "warn" */
@Entity()
export default class Transaction extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  hash!: string

  @Column({
    type: 'varchar',
  })
  version!: string

  @Column({
    type: 'simple-json',
  })
  deps!: OutPoint[]

  @Column({
    type: 'simple-json',
  })
  witnesses!: Witness[]

  @Column({
    type: 'varchar',
    nullable: true,
  })
  timestamp: string | undefined = undefined

  @Column({
    type: 'varchar',
    nullable: true,
  })
  blockNumber: string | undefined = undefined

  @Column({
    type: 'varchar',
    nullable: true,
  })
  blockHash: string | undefined = undefined

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description?: string

  @Column({
    type: 'varchar',
  })
  status!: TransactionStatus

  @Column({
    type: 'varchar',
  })
  createdAt!: string

  @Column({
    type: 'varchar',
  })
  updatedAt!: string

  @OneToMany(_type => InputEntity, input => input.transaction)
  inputs!: InputEntity[]

  @OneToMany(_type => OutputEntity, output => output.transaction)
  outputs!: OutputEntity[]

  public toInterface(): TransactionInterface {
    return {
      hash: this.hash,
      version: this.version,
      deps: this.deps,
      inputs: this.inputs.map(input => input.toInterface()),
      outputs: this.outputs.map(output => output.toInterface()),
      timestamp: this.timestamp,
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      witnesses: this.witnesses,
      description: this.description,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  @BeforeInsert()
  updateCreatedAt() {
    this.createdAt = Date.now().toString()
    this.updatedAt = this.createdAt
  }

  @BeforeUpdate()
  updateUpdatedAt() {
    this.updatedAt = Date.now().toString()
  }
}

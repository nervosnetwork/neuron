import { Entity, BaseEntity, PrimaryColumn, Column, OneToMany } from 'typeorm'
import { Witness, OutPoint, Transaction as TransactionInterface } from '../app-types/types'
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
  })
  timestamp!: string

  @Column({
    type: 'varchar',
  })
  blockNumber!: string

  @Column({
    type: 'varchar',
  })
  blockHash!: string

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
    }
  }
}

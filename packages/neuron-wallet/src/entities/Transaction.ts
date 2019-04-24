import { Entity, BaseEntity, PrimaryColumn, Column, OneToMany } from 'typeorm'
import { Witness } from '../services/transactions'
import InputEntity from './Input'
import OutputEntity from './Output'

interface OutPoint {
  hash: string
  index: number
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
@Entity()
export default class Transaction extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  hash!: string

  @Column({
    type: 'int',
  })
  version!: number

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
  value!: string

  @Column({
    type: 'varchar',
  })
  blockNumber!: string

  @Column({
    type: 'varchar',
  })
  blockHash!: string

  @Column({
    type: 'varchar',
  })
  type!: string

  @OneToMany(_type => InputEntity, input => input.transaction)
  inputs!: InputEntity[]

  @OneToMany(_type => OutputEntity, output => output.transaction)
  outputs!: OutputEntity[]
}

import {
  Entity,
  BaseEntity,
  PrimaryColumn,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  AfterInsert,
  AfterUpdate,
  AfterRemove,
} from 'typeorm'
import TxDbChangedSubject from 'models/subjects/tx-db-changed-subject'
import InputEntity from './input'
import OutputEntity from './output'
import { Transaction as TransactionModel, TransactionStatus } from 'models/chain/transaction'
import { CellDep } from 'models/chain/cell-dep'

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
  cellDeps: CellDep[] = []

  @Column({
    type: 'simple-json',
  })
  headerDeps: string[] = []

  @Column({
    type: 'simple-json',
  })
  witnesses!: string[]

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

  // only used for check fork in indexer mode
  @Column({
    type: 'boolean',
  })
  confirmed: boolean = false

  @OneToMany(_type => InputEntity, input => input.transaction)
  inputs!: InputEntity[]

  @OneToMany(_type => OutputEntity, output => output.transaction)
  outputs!: OutputEntity[]

  public toInterface(): TransactionModel {
    const inputs = this.inputs ? this.inputs.map(input => input.toInterface()) : []
    const outputs = this.outputs ? this.outputs.map(output => output.toInterface()) : []
    return new TransactionModel({
      hash: this.hash,
      version: this.version,
      cellDeps: this.cellDeps,
      headerDeps: this.headerDeps,
      inputs,
      outputs,
      timestamp: this.timestamp,
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      witnesses: this.witnesses,
      description: this.description,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    })
  }

  @BeforeInsert()
  updateCreatedAt() {
    this.createdAt = Date.now().toString()
    this.updatedAt = this.createdAt
    if (!this.timestamp) {
      this.timestamp = this.createdAt
    }
  }

  @BeforeUpdate()
  updateUpdatedAt() {
    this.updatedAt = Date.now().toString()
  }

  @AfterInsert()
  emitInsert() {
    this.changed('AfterInsert')
  }

  @AfterUpdate()
  emitUpdate() {
    this.changed('AfterUpdate')
  }

  @AfterRemove()
  emitRemove() {
    this.changed('AfterRemove')
  }

  private changed = (event: string) => {
    TxDbChangedSubject.getSubject().next({
      event,
      tx: this.toInterface(),
    })
  }
}

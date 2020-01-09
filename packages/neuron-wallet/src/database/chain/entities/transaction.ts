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
import TransactionModel, { TransactionStatus } from 'models/chain/transaction'
import CellDep, { DepType } from 'models/chain/cell-dep'
import OutPoint from 'models/chain/out-point'
import Input from 'models/chain/input'
import Output from 'models/chain/output'

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

  public toModel(): TransactionModel {
    const inputs: Input[] = this.inputs ? this.inputs.map(input => input.toModel()) : []
    const outputs: Output[] = this.outputs ? this.outputs.map(output => output.toModel()) : []
    return TransactionModel.fromObject({
      hash: this.hash,
      version: this.version,
      cellDeps: this.cellDeps?.map((cd: any) => {
        if (cd instanceof CellDep) {
          return cd
        }
        return new CellDep(new OutPoint(cd.outPoint.txHash, cd.outPoint.index), cd.depType as DepType)
      }) || [],
      headerDeps: this.headerDeps,
      inputs,
      outputs,
      timestamp: this.timestamp,
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      witnesses: this.witnesses,
      description: this.description || '',
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      outputsData: [],
      nervosDao: false
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
      tx: this.toModel(),
    })
  }
}

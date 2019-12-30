import { Entity, BaseEntity, Column, PrimaryColumn, ManyToOne } from 'typeorm'
import TransactionEntity from './transaction'
import { ScriptInterface } from 'models/chain/script'
import OutPoint from 'models/chain/out-point'
import { Output as OutputModel, OutputStatus } from 'models/chain/output'

@Entity()
export default class Output extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  outPointTxHash!: string

  @PrimaryColumn({
    type: 'varchar',
  })
  outPointIndex!: string

  @Column({
    type: 'varchar',
  })
  capacity!: string

  @Column({
    type: 'simple-json',
  })
  lock!: ScriptInterface

  @Column({
    type: 'varchar',
  })
  lockHash!: string

  @Column({
    type: 'varchar',
  })
  status!: string

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  typeScript: ScriptInterface | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeHash: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  daoData: string | null = null

  @Column({
    type: 'boolean',
  })
  hasData!: boolean

  @Column({
    type: 'varchar',
    nullable: true,
  })
  depositTxHash: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  depositIndex: string | null = null

  public outPoint(): OutPoint {
    return new OutPoint({
      txHash: this.outPointTxHash,
      index: this.outPointIndex,
    })
  }

  public depositOutPoint(): OutPoint | undefined {
    if (this.depositTxHash && this.depositIndex) {
      return new OutPoint({
        txHash: this.depositTxHash,
        index: this.depositIndex
      })
    }
    return undefined
  }

  @ManyToOne(_type => TransactionEntity, transaction => transaction.outputs, { onDelete: 'CASCADE' })
  transaction!: TransactionEntity

  public toInterface(): OutputModel {
    const timestamp = this.transaction?.timestamp || this.transaction?.createdAt

    return new OutputModel({
      capacity: this.capacity,
      lock: this.lock,
      lockHash: this.lockHash,
      outPoint: this.outPoint(),
      status: this.status as OutputStatus,
      type: this.typeScript,
      typeHash: this.typeHash ? this.typeHash : undefined,
      daoData: this.daoData,
      timestamp,
      blockNumber: this.transaction?.blockNumber,
      blockHash: this.transaction?.blockHash,
      depositOutPoint: this.depositOutPoint(),
    })
  }
}

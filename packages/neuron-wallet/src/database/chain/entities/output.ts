import { Entity, BaseEntity, Column, PrimaryColumn, ManyToOne } from 'typeorm'
import TransactionEntity from './transaction'
import Script from 'models/chain/script'
import OutPoint from 'models/chain/out-point'
import OutputModel, { OutputStatus } from 'models/chain/output'

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
  lock!: Script

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
  typeScript: Script | null = null

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

  @Column({
    type: 'varchar',
    nullable: true,
  })
  multiSignBlake160: string | null = null

  public outPoint(): OutPoint {
    return new OutPoint(
      this.outPointTxHash,
      this.outPointIndex,
    )
  }

  public depositOutPoint(): OutPoint | undefined {
    if (this.depositTxHash && this.depositIndex) {
      return new OutPoint(
        this.depositTxHash,
        this.depositIndex
      )
    }
    return undefined
  }

  @ManyToOne(_type => TransactionEntity, transaction => transaction.outputs, { onDelete: 'CASCADE' })
  transaction!: TransactionEntity

  public toModel(): OutputModel {
    const timestamp = this.transaction?.timestamp || this.transaction?.createdAt

    return OutputModel.fromObject({
      capacity: this.capacity,
      lock: new Script(this.lock.codeHash, this.lock.args, this.lock.hashType),
      lockHash: this.lockHash,
      outPoint: this.outPoint(),
      status: this.status as OutputStatus,
      type: this.typeScript ? new Script(this.typeScript.codeHash, this.typeScript.args, this.typeScript.hashType) : this.typeScript,
      typeHash: this.typeHash ? this.typeHash : undefined,
      daoData: this.daoData,
      timestamp,
      blockNumber: this.transaction?.blockNumber,
      blockHash: this.transaction?.blockHash,
      depositOutPoint: this.depositOutPoint(),
    })
  }
}

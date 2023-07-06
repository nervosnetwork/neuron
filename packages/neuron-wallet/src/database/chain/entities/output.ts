import { Entity, BaseEntity, Column, PrimaryColumn, ManyToOne } from 'typeorm'
import TransactionEntity from './transaction'
import OutPoint from '../../../models/chain/out-point'
import OutputModel, { OutputStatus } from '../../../models/chain/output'
import { HashType, Script } from '@ckb-lumos/base'

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
    type: 'varchar',
  })
  lockCodeHash!: string

  @Column({
    type: 'varchar',
  })
  lockArgs!: string

  @Column({
    type: 'varchar',
  })
  lockHashType!: HashType

  @Column({
    type: 'varchar',
  })
  lockHash!: string

  @Column({
    type: 'varchar',
  })
  status!: string

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeCodeHash: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeArgs: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeHashType: HashType | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  typeHash: string | null = null

  // only first 130 chars
  @Column({
    type: 'varchar',
    default: '0x',
  })
  data: string = '0x'

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
    return new OutPoint(this.outPointTxHash, this.outPointIndex)
  }

  public depositOutPoint(): OutPoint | undefined {
    if (this.depositTxHash && this.depositIndex) {
      return new OutPoint(this.depositTxHash, this.depositIndex)
    }
    return undefined
  }

  public lockScript(): Script {
    return {
      codeHash: this.lockCodeHash,
      args: this.lockArgs,
      hashType: this.lockHashType as HashType,
    }
  }

  public typeScript(): Script | undefined {
    if (this.typeCodeHash && this.typeArgs && this.typeHashType) {
      return {
        codeHash: this.typeCodeHash,
        args: this.typeArgs,
        hashType: this.typeHashType as HashType,
      }
    }
    return undefined
  }

  @ManyToOne(_type => TransactionEntity, transaction => transaction.outputs, { onDelete: 'CASCADE' })
  transaction!: TransactionEntity

  public toModel(): OutputModel {
    const timestamp = this.transaction?.timestamp || this.transaction?.createdAt

    return OutputModel.fromObject({
      capacity: this.capacity,
      lock: this.lockScript(),
      lockHash: this.lockHash,
      outPoint: this.outPoint(),
      status: this.status as OutputStatus,
      type: this.typeScript(),
      typeHash: this.typeHash ? this.typeHash : undefined,
      data: this.data,
      daoData: this.daoData,
      timestamp,
      blockNumber: this.transaction?.blockNumber,
      blockHash: this.transaction?.blockHash,
      depositOutPoint: this.depositOutPoint(),
      multiSignBlake160: this.multiSignBlake160,
    })
  }
}

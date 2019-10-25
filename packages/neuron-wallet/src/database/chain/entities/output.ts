import { Entity, BaseEntity, Column, PrimaryColumn, ManyToOne } from 'typeorm'
import { Script, OutPoint, Cell } from 'types/cell-types'
import TransactionEntity from './transaction'

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
    type: 'boolean',
  })
  hasData!: boolean

  public outPoint(): OutPoint {
    return {
      txHash: this.outPointTxHash,
      index: this.outPointIndex,
    }
  }

  @ManyToOne(_type => TransactionEntity, transaction => transaction.outputs, { onDelete: 'CASCADE' })
  transaction!: TransactionEntity

  public toInterface(): Cell {
    return {
      capacity: this.capacity,
      lock: this.lock,
      lockHash: this.lockHash,
      outPoint: this.outPoint(),
      status: this.status,
    }
  }
}

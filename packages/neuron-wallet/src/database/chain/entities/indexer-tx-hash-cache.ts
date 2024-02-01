import { Column, Entity, Index, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export default class IndexerTxHashCache extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'character',
    length: 32,
  })
  @Index()
  txHash!: string

  @Column({
    type: 'character',
    length: 32,
  })
  @Index()
  lockHash!: string

  @Column({
    type: 'character',
    length: 32,
  })
  @Index()
  walletId!: string

  @Column()
  @Index()
  blockNumber!: number

  @Column()
  @Index()
  isProcessed: boolean = false

  @CreateDateColumn({
    type: 'varchar',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date

  @UpdateDateColumn({
    type: 'varchar',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date

  static fromObject(obj: { txHash: string; blockNumber: number; lockHash: string; walletId: string }) {
    const result = new IndexerTxHashCache()
    result.txHash = obj.txHash
    result.blockNumber = obj.blockNumber
    result.lockHash = obj.lockHash
    result.walletId = obj.walletId
    result.isProcessed = false
    return result
  }
}

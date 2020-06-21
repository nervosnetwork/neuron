import {Column, Entity, Index, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn} from "typeorm"

@Entity()
export default class IndexerTxHashCache extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: "character",
    length: 32,
  })
  @Index()
  txHash!: string

  @Column({
    type: "character",
    length: 32,
  })
  @Index()
  lockHash!: string

  @Column({
    type: "character",
    length: 32,
  })
  @Index()
  address!: string

  @Column({
    type: "character",
    length: 32,
  })
  @Index()
  walletId!: string

  @Column({
    type: "varchar",
    length: 20,
  })
  @Index()
  blockNumber!: string

  @Column({
    type: "character",
    length: 32,
  })
  @Index()
  blockHash!: string

  @Column({
    type: 'varchar',
  })
  @Index()
  blockTimestamp!: string

  @Column()
  @Index()
  isProcessed: boolean = false

  @CreateDateColumn({
    type: "varchar", default: () => "CURRENT_TIMESTAMP"
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "varchar", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP"
  })
  updatedAt!: Date;
}

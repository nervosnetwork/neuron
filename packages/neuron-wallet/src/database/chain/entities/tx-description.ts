import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm'

@Entity()
export default class TxDescription {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar'
  })
  walletId!: string

  @Column({
    type: 'varchar'
  })
  @Index()
  txHash!: string

  @Column({
    type: 'varchar'
  })
  description!: string
}

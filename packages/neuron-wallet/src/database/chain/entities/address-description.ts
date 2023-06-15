import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm'

@Entity()
export default class AddressDescription {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar',
  })
  @Index()
  walletId!: string

  @Column({
    type: 'varchar',
  })
  @Index()
  address!: string

  @Column({
    type: 'varchar',
  })
  description!: string
}

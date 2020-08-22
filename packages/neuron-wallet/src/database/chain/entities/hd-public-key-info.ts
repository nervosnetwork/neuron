import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm'
import { AddressType } from 'models/keys/address'

@Entity()
export default class HdPublicKeyInfo {

  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: "varchar",
  })
  @Index()
  walletId!: string

  @Column({
    type: 'varchar',
  })
  path!: string

  @Column({
    type: 'varchar',
  })
  @Index()
  address!: string

  @Column()
  addressType!: AddressType

  @Column()
  @Index()
  addressIndex!: number

  @Column({
    type: 'varchar',
  })
  publicKeyInBlake160!: string

  @Column({
    default: false
  })
  @Index()
  used!: boolean

  @Column({
    type: 'varchar',
    default: null
  })
  description?: string

  @CreateDateColumn({
    type: "varchar",
    default: () => "CURRENT_TIMESTAMP"
  })
  createdAt!: Date;
}

import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { AddressType } from '../../keys/address'

@Entity()
export default class Address extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar',
  })
  walletId!: string

  @Column({
    type: 'varchar',
  })
  address!: string

  @Column({
    type: 'varchar',
  })
  path!: string

  @Column({
    type: 'int',
  })
  addressType!: AddressType

  @Column({
    type: 'int',
  })
  addressIndex!: number

  @Column({
    type: 'int',
  })
  txCount!: number

  @Column({
    type: 'varchar',
  })
  blake160!: string
}

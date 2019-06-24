import { Entity, BaseEntity, PrimaryColumn, Column } from 'typeorm'
import { AddressType } from '../../keys/address'
import { Address as AddressInterface } from '../dao'

export enum AddressVersion {
  Testnet = 'testnet',
  Mainnet = 'mainnet',
}

@Entity()
export default class Address extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  address!: string

  @PrimaryColumn({
    type: 'varchar',
  })
  walletId!: string

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

  @Column({
    type: 'varchar',
  })
  version!: AddressVersion

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description?: string

  public toInterface = (): AddressInterface => {
    return {
      address: this.address,
      walletId: this.walletId,
      path: this.path,
      addressType: this.addressType,
      addressIndex: this.addressIndex,
      txCount: this.txCount,
      blake160: this.blake160,
      version: this.version,
      description: this.description,
    }
  }
}

import { Entity, BaseEntity, PrimaryColumn, Column, AfterInsert, AfterUpdate, AfterRemove } from 'typeorm'
import { AddressType } from '../../models/keys/address'
import { Address as AddressInterface } from '../dao'
import AddressDbChangedSubject from '../../subjects/address-db-changed-subject'

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

  @Column({
    type: 'varchar',
  })
  balance: string = '0'

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
      balance: this.balance,
      description: this.description,
    }
  }

  @AfterInsert()
  emitInsert() {
    this.changed('AfterInsert')
  }

  @AfterUpdate()
  emitUpdate() {
    this.changed('AfterUpdate')
  }

  @AfterRemove()
  emitRemove() {
    this.changed('AfterRemove')
  }

  private changed = (event: string) => {
    AddressDbChangedSubject.getSubject().next(event)
  }
}

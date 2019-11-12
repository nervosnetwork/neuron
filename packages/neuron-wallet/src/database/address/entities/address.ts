import { remote } from 'electron'
import { Entity, BaseEntity, PrimaryColumn, Column, AfterInsert, AfterUpdate, AfterRemove } from 'typeorm'
import { AddressType } from 'models/keys/address'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import { Address as AddressInterface } from '../dao'

export enum AddressVersion {
  Testnet = 'testnet',
  Mainnet = 'mainnet',
}

const isRenderer = process && process.type === 'renderer'
const addressDbChangedSubject = isRenderer
  ? remote.require('./models/subjects/address-db-changed-subject').default.getSubject()
  : AddressDbChangedSubject.getSubject()

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
  liveBalance: string = '0'

  @Column()
  sentBalance: string = '0'

  @Column()
  pendingBalance: string = '0'

  public balance = (): string => {
    return (BigInt(this.liveBalance) + BigInt(this.sentBalance)).toString()
  }

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
      liveBalance: this.liveBalance,
      sentBalance: this.sentBalance,
      pendingBalance: this.pendingBalance,
      balance: this.balance(),
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
    addressDbChangedSubject.next(event)
  }
}

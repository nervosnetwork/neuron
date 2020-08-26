import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm'
import HdPublicKeyInfoModel from 'models/keys/hd-public-key-info'
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
    type: 'varchar',
    default: null
  })
  description?: string

  @CreateDateColumn({
    type: "varchar",
    default: () => "CURRENT_TIMESTAMP"
  })
  createdAt!: Date;

  public static fromModel(model: HdPublicKeyInfoModel): HdPublicKeyInfo {
    const publicKeyInfo = new HdPublicKeyInfo()

    publicKeyInfo.walletId = model.walletId
    publicKeyInfo.path = model.path
    publicKeyInfo.address = model.address
    publicKeyInfo.addressType = model.addressType
    publicKeyInfo.addressIndex = model.addressIndex
    publicKeyInfo.publicKeyInBlake160 = model.publicKeyInBlake160
    publicKeyInfo.description = model.description

    return publicKeyInfo
  }

  public static fromObject(...args: any[]): HdPublicKeyInfo {
    const model = HdPublicKeyInfoModel.fromObject.apply(HdPublicKeyInfoModel, args)
    return this.fromModel(model)
  }
}

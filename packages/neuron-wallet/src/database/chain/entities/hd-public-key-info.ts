import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm'
import HdPublicKeyInfoModel from '../../../models/keys/hd-public-key-info'
import { hd } from '@ckb-lumos/lumos'

@Entity()
export default class HdPublicKeyInfo {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar',
  })
  @Index()
  walletId!: string

  @Column()
  addressType!: hd.AddressType

  @Column()
  @Index()
  addressIndex!: number

  @Column({
    type: 'varchar',
  })
  publicKeyInBlake160!: string

  @CreateDateColumn({
    type: 'varchar',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date

  public static fromModel(model: HdPublicKeyInfoModel): HdPublicKeyInfo {
    const publicKeyInfo = new HdPublicKeyInfo()

    publicKeyInfo.walletId = model.walletId
    publicKeyInfo.addressType = model.addressType
    publicKeyInfo.addressIndex = model.addressIndex
    publicKeyInfo.publicKeyInBlake160 = model.publicKeyInBlake160

    return publicKeyInfo
  }

  public toModel(): HdPublicKeyInfoModel {
    return HdPublicKeyInfoModel.fromObject(this)
  }

  public static fromObject(...args: Parameters<typeof HdPublicKeyInfoModel.fromObject>): HdPublicKeyInfo {
    const model = HdPublicKeyInfoModel.fromObject(...args)
    return this.fromModel(model)
  }
}

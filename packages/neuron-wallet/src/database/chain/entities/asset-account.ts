import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm'
import AssetAccountModel from '../../../models/asset-account'
import SudtTokenInfo from './sudt-token-info'
import { UDTType } from '../../../utils/const'

@Entity()
@Index(['tokenID', 'blake160', 'udtType'], { unique: true })
export default class AssetAccount {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar',
  })
  tokenID!: string

  @Column({
    type: 'varchar',
    nullable: true,
  })
  udtType?: UDTType

  @Column({
    type: 'varchar',
    default: '',
  })
  accountName!: string

  @Column({
    type: 'varchar',
  })
  balance!: string

  @Column({
    type: 'varchar',
  })
  blake160!: string

  @ManyToOne(_type => SudtTokenInfo, sudtTokenInfo => sudtTokenInfo.assetAccounts, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tokenID', referencedColumnName: 'tokenID' }])
  sudtTokenInfo!: SudtTokenInfo

  public static fromModel(info: AssetAccountModel): AssetAccount {
    const assetAccount = new AssetAccount()

    assetAccount.tokenID = info.tokenID
    assetAccount.accountName = info.accountName
    assetAccount.balance = info.balance
    assetAccount.blake160 = info.blake160
    assetAccount.udtType = info.udtType

    const sudtTokenInfo = new SudtTokenInfo()
    sudtTokenInfo.tokenID = info.tokenID
    sudtTokenInfo.symbol = info.symbol
    sudtTokenInfo.tokenName = info.tokenName
    sudtTokenInfo.decimal = info.decimal
    sudtTokenInfo.udtType = info.udtType
    assetAccount.sudtTokenInfo = sudtTokenInfo

    return assetAccount
  }

  public toModel(): AssetAccountModel {
    return new AssetAccountModel(
      this.tokenID,
      this.sudtTokenInfo.symbol,
      this.accountName,
      this.sudtTokenInfo.tokenName,
      this.sudtTokenInfo.decimal,
      this.balance,
      this.blake160,
      this.id,
      this.udtType
    )
  }
}

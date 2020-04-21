import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne } from 'typeorm'
import AssetAccountModel from 'models/asset-account'
import SudtTokenInfo from './sudt-token-info'

@Entity()
@Index(['walletID', 'tokenID', 'blake160'], { unique: true })
export default class AssetAccount {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar'
  })
  walletID!: string

  @Column({
    type: 'varchar'
  })
  tokenID!: string

  @Column({
    type: 'varchar',
    default: '',
  })
  accountName!: string

  @Column({
    type: 'varchar'
  })
  balance!: string

  @Column({
    type: 'varchar'
  })
  blake160!: string

  @ManyToOne(_type => SudtTokenInfo, sudtTokenInfo => sudtTokenInfo.assetAccounts, { onDelete: 'CASCADE' })
  sudtTokenInfo!: SudtTokenInfo

  public static fromModel(info: AssetAccountModel): AssetAccount {
    const assetAccount = new AssetAccount()
    assetAccount.walletID = info.walletID
    assetAccount.tokenID = info.tokenID
    // assetAccount.symbol = info.symbol
    assetAccount.accountName = info.accountName
    // assetAccount.tokenName = info.tokenName
    // assetAccount.decimal = info.decimal
    assetAccount.balance = info.balance
    assetAccount.blake160 = info.blake160
    return assetAccount
  }

  public toModel(): AssetAccountModel {
    return new AssetAccountModel(
      this.walletID,
      this.tokenID,
      '',
      this.accountName,
      '',
      '',
      this.balance,
      this.blake160,
      this.id
    )
  }
}

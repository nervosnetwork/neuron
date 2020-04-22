import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm'
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
  @JoinColumn([
    { name: 'walletID', referencedColumnName: 'walletID' },
    { name: 'tokenID', referencedColumnName: 'tokenID' },
  ])
  sudtTokenInfo!: SudtTokenInfo

  public static fromModel(info: AssetAccountModel): AssetAccount {
    const assetAccount = new AssetAccount()

    assetAccount.walletID = info.walletID
    assetAccount.tokenID = info.tokenID
    assetAccount.accountName = info.accountName
    assetAccount.balance = info.balance
    assetAccount.blake160 = info.blake160

    const sudtTokenInfo = new SudtTokenInfo()
    sudtTokenInfo.symbol = info.symbol
    sudtTokenInfo.tokenName = info.tokenName
    sudtTokenInfo.decimal = info.decimal
    assetAccount.sudtTokenInfo = sudtTokenInfo

    return assetAccount
  }

  public toModel(): AssetAccountModel {
    return new AssetAccountModel(
      this.walletID,
      this.tokenID,
      this.sudtTokenInfo.symbol,
      this.accountName,
      this.sudtTokenInfo.tokenName,
      this.sudtTokenInfo.decimal,
      this.balance,
      this.blake160,
      this.id
    )
  }
}

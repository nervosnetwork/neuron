import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm'
import AssetAccountModel from 'models/asset-account'

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
    type: 'varchar'
  })
  symbol!: string

  @Column({
    type: 'varchar'
  })
  fullName!: string

  @Column({
    type: 'varchar'
  })
  decimal!: string

  @Column({
    type: 'varchar'
  })
  balance!: string

  @Column({
    type: 'varchar'
  })
  blake160!: string

  public static fromModel(info: AssetAccountModel): AssetAccount {
    const assetAccount = new AssetAccount()
    assetAccount.walletID = info.walletID
    assetAccount.tokenID = info.tokenID
    assetAccount.symbol = info.symbol
    assetAccount.fullName = info.fullName
    assetAccount.decimal = info.decimal
    assetAccount.balance = info.balance
    assetAccount.blake160 = info.blake160
    return assetAccount
  }

  public toModel(): AssetAccountModel {
    return new AssetAccountModel(
      this.walletID,
      this.tokenID,
      this.symbol,
      this.fullName,
      this.decimal,
      this.balance,
      this.blake160,
      this.id
    )
  }
}

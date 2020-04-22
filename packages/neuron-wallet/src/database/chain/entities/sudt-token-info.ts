import { Entity, Column, Index, OneToMany, PrimaryColumn } from "typeorm";
import AssetAccount from "./asset-account";

@Entity()
@Index(['walletID', 'tokenID'], { unique: true })
export default class SudtTokenInfo {
  @PrimaryColumn({
    type: 'varchar'
  })
  walletID!: string

  @PrimaryColumn({
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
  tokenName!: string

  @Column({
    type: 'varchar'
  })
  decimal!: string

  @OneToMany(_type => AssetAccount, assetAccount => assetAccount.sudtTokenInfo)
  assetAccounts!: AssetAccount[]
}

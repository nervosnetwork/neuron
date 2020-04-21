import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from "typeorm";
import AssetAccount from "./asset-account";

@Entity()
@Index(['walletID', 'tokenID'], { unique: true })
export default class SudtTokenInfo {
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
  tokenName!: string

  @Column({
    type: 'varchar'
  })
  decimal!: string

  @OneToMany(_type => AssetAccount, assetAccount => assetAccount.sudtTokenInfo)
  assetAccounts!: AssetAccount[]
}

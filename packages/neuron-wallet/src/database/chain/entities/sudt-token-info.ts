import { Entity, Column, Index, OneToMany, PrimaryColumn } from 'typeorm'
import AssetAccount from './asset-account'
import { UDTType } from '../../../utils/const'

@Entity()
@Index(['tokenID', 'udtType'], { unique: true })
export default class SudtTokenInfo {
  @PrimaryColumn({
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
  })
  symbol!: string

  @Column({
    type: 'varchar',
  })
  tokenName!: string

  @Column({
    type: 'varchar',
  })
  decimal!: string

  @OneToMany(_type => AssetAccount, assetAccount => assetAccount.sudtTokenInfo)
  assetAccounts!: AssetAccount[]

  public toModel() {
    return {
      tokenID: this.tokenID,
      tokenName: this.tokenName,
      symbol: this.symbol,
      decimal: this.decimal,
      udtType: this.udtType,
    }
  }
}

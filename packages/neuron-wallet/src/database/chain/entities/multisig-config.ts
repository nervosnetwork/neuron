import MultisigConfigModel from 'models/multisig-config'
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm'

@Entity()
export default class MultisigConfig {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  @Index()
  walletId!: string

  @Column()
  m!: number

  @Column()
  n!: number

  @Column()
  r!: number

  @Column('simple-array')
  addresses!: string[]

  @Column()
  alias!: string

  @Column()
  fullPayload!: string

  public static fromModel(model: MultisigConfigModel): MultisigConfig {
    const multisigConfig = new MultisigConfig()

    multisigConfig.walletId = model.walletId
    multisigConfig.m = model.m
    multisigConfig.n = model.n
    multisigConfig.r = model.r
    multisigConfig.addresses = model.addresses
    if (model.alias) {
      multisigConfig.alias = model.alias
    }
    multisigConfig.fullPayload = model.fullPayload

    return multisigConfig
  }
}

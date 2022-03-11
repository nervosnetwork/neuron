import MultiSignConfigModel from 'models/multi-sign-config'
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm'

@Entity()
export default class MultiSignConfig {
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
  blake160s!: string[]

  @Column()
  alias!: string

  @Column()
  fullPayload!: string

  public static fromModel(model: MultiSignConfigModel): MultiSignConfig {
    const multiSignConfig = new MultiSignConfig()

    multiSignConfig.walletId = model.walletId
    multiSignConfig.m = model.m
    multiSignConfig.n = model.n
    multiSignConfig.r = model.r
    multiSignConfig.blake160s = model.blake160s
    if (model.alias) {
      multiSignConfig.alias = model.alias
    }
    multiSignConfig.fullPayload = model.fullPayload

    return multiSignConfig
  }
}

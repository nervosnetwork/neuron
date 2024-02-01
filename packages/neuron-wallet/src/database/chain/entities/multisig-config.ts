import MultisigConfigModel from '../../../models/multisig-config'
import MultisigConfigDbChangedSubject from '../../../models/subjects/multisig-config-db-changed-subject'
import { Entity, Column, PrimaryGeneratedColumn, Index, AfterInsert, AfterRemove } from 'typeorm'

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
  blake160s!: string[]

  @Column()
  alias!: string

  @Column()
  lastestBlockNumber!: string

  public static fromModel(model: MultisigConfigModel): MultisigConfig {
    const multisigConfig = new MultisigConfig()

    multisigConfig.walletId = model.walletId
    multisigConfig.r = model.r
    multisigConfig.m = model.m
    multisigConfig.n = model.n
    multisigConfig.blake160s = model.blake160s
    if (model.alias) {
      multisigConfig.alias = model.alias
    }
    return multisigConfig
  }

  public cloneIgnoreBlockNumber(): MultisigConfig {
    const multisigConfig = new MultisigConfig()

    multisigConfig.walletId = this.walletId
    multisigConfig.r = this.r
    multisigConfig.m = this.m
    multisigConfig.n = this.n
    multisigConfig.blake160s = this.blake160s
    if (this.alias) {
      multisigConfig.alias = this.alias
    }
    return multisigConfig
  }

  @AfterInsert()
  emitInsert() {
    this.changed('AfterInsert')
  }

  @AfterRemove()
  emitRemove() {
    this.changed('AfterRemove')
  }

  private changed = (event: 'AfterInsert' | 'AfterRemove') => {
    MultisigConfigDbChangedSubject.getSubject().next(event)
  }
}

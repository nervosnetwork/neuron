import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export default class SyncInfo {
  public static CURRENT_BLOCK_NUMBER = 'currentBlockNumber'

  @PrimaryColumn({
    type: 'varchar',
  })
  name!: string

  @Column({
    type: 'varchar',
  })
  value!: string
  
  static fromObject(params: {
    name: string,
    value: string
  }) {
    const res = new SyncInfo()
    res.name = params.name
    res.value = params.value
    return res
  }

  static getLastCachedKey(walletId: string) {
    return `lastCachedBlockNumber_${walletId}`
  }
}

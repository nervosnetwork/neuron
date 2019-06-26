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
}

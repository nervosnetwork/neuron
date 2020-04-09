import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export default class SyncInfo {
  public static CURRENT_BLOCK_NUMBER = 'currentBlockNumber'
  public static CURRENT_LIVE_CELL_BLOCK_NUMBER = 'currentLiveCellNumber'

  @PrimaryColumn({
    type: 'varchar',
  })
  name!: string

  @Column({
    type: 'varchar',
  })
  value!: string
}

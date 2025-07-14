import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm'

@Entity()
export default class PerunActivity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar',
  })
  channelId!: string

  @Column({
    type: 'varchar',
  })
  status!: 'Close' | 'Open' | 'Update'

  @Column({
    type: 'varchar',
  })
  timestamp!: string

  static fromObject(params: { channelId: string; status: 'Close' | 'Open' | 'Update'; timestamp: string }) {
    const res = new PerunActivity()
    res.channelId = params.channelId
    res.status = params.status
    res.timestamp = params.timestamp
    return res
  }

  public toModel() {
    return {
      channelId: this.channelId,
      status: this.status,
      timestamp: this.timestamp,
    }
  }
}

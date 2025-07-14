import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm'

@Entity()
export default class PerunChannel {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar',
  })
  channelId!: string

  @Column({
    type: 'varchar',
  })
  pubKey!: string

  @Column({
    type: 'varchar',
  })
  peerAddress!: string

  @Column({
    type: 'varchar',
  })
  isFinal!: boolean

  @Column({
    type: 'varchar',
  })
  version!: string

  static fromObject(params: {
    channelId: string
    pubKey: string
    peerAddress: string
    isFinal: boolean
    version: string
  }) {
    const res = new PerunChannel()
    res.channelId = params.channelId
    res.pubKey = params.pubKey
    res.peerAddress = params.peerAddress
    res.isFinal = params.isFinal
    res.version = params.version
    return res
  }

  public toModel() {
    return {
      channelId: this.channelId,
      pubKey: this.pubKey,
      peerAddress: this.peerAddress,
      isFinal: this.isFinal,
      version: this.version,
    }
  }
}

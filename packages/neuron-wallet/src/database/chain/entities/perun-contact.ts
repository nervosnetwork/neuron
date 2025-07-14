import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm'

@Entity()
export default class PerunContact {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'varchar',
  })
  pubKey!: string

  @Column({
    type: 'varchar',
  })
  type!: string

  @Column({
    type: 'varchar',
  })
  request!: string

  static fromObject(params: { pubKey: string; type: string; request: any }) {
    const res = new PerunContact()
    res.pubKey = params.pubKey
    res.type = params.type
    res.request = JSON.stringify(params.request)
    return res
  }

  public toModel() {
    return {
      pubKey: this.pubKey,
      type: this.type,
      request: JSON.parse(this.request),
    }
  }
}

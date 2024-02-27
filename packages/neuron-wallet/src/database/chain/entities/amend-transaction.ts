import { Entity, Column, PrimaryColumn } from 'typeorm'

@Entity()
export default class AmendTransaction {
  @PrimaryColumn({
    type: 'varchar',
  })
  hash!: string

  @Column({
    type: 'varchar',
  })
  amendHash!: string

  static fromObject(params: { hash: string; amendHash: string }) {
    const res = new AmendTransaction()
    res.hash = params.hash
    res.amendHash = params.amendHash
    return res
  }

  public toModel() {
    return {
      hash: this.hash,
      amendHash: this.amendHash,
    }
  }
}

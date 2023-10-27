import { BaseEntity, Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Entity()
export default class TxLock extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  transactionHash!: string

  @PrimaryColumn({
    type: 'varchar',
  })
  lockHash!: string

  @Column({
    type: 'varchar',
  })
  @Index()
  // check whether saving wallet blake160
  lockArgs!: string

  static fromObject(obj: { txHash: string; lockHash: string; lockArgs: string }) {
    const res = new TxLock()
    res.transactionHash = obj.txHash
    res.lockHash = obj.lockHash
    res.lockArgs = obj.lockArgs
    return res
  }
}

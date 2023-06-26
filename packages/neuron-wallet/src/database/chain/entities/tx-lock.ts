import { BaseEntity, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export default class TxLock extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar'
  })
  transactionHash!: string

  @PrimaryColumn({
    type: 'varchar',
  })
  lockHash!: string
  
  static fromObject(obj: {
    txHash: string
    lockHash: string
  }) {
    const res = new TxLock()
    res.transactionHash = obj.txHash
    res.lockHash = obj.lockHash
    return res
  }
}

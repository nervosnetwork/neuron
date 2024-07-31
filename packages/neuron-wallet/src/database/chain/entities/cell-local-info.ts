import type { OutPoint } from '@ckb-lumos/lumos'
import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export default class CellLocalInfo {
  @PrimaryColumn({
    type: 'varchar',
    transformer: {
      to: CellLocalInfo.getKey,
      from: CellLocalInfo.fromKey,
    },
  })
  outPoint!: OutPoint

  @Column({
    type: 'boolean',
    default: false,
  })
  locked?: boolean

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description?: string

  get key() {
    return CellLocalInfo.getKey(this.outPoint)
  }

  static getKey(value: CKBComponents.OutPoint) {
    return `${value.txHash}_${value.index}`
  }

  static fromKey(value: string): CKBComponents.OutPoint {
    const [txHash, index] = value.split('_')
    return {
      txHash,
      index,
    }
  }
}

export type UpdateCellLocalInfo = Pick<CellLocalInfo, 'outPoint' | 'locked' | 'description'>

import { Entity, PrimaryColumn, Column } from 'typeorm'

export const outPointTransformer = {
  to(value: CKBComponents.OutPoint) {
    return `${value.txHash}_${value.index}`
  },
  from(value: string): CKBComponents.OutPoint {
    const [txHash, index] = value.split('_')
    return {
      txHash,
      index,
    }
  },
}

@Entity()
export default class CellLocalInfo {
  @PrimaryColumn({
    type: 'varchar',
    transformer: outPointTransformer,
  })
  outPoint!: CKBComponents.OutPoint

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
}

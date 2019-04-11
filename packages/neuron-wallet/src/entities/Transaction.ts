import { Entity, BaseEntity, PrimaryColumn, Column } from 'typeorm'
import { Cell } from '../cell'

interface OutPoint {
  hash: string
  index: number
}

interface Input {
  previousOutput: OutPoint
  args: string[]
}

@Entity()
export default class Transaction extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  hash!: string

  @Column({
    type: 'int',
  })
  version!: number

  @Column({
    type: 'simple-json',
  })
  deps!: OutPoint[]

  @Column({
    type: 'simple-json',
  })
  witnesses!: object[]

  @Column({
    type: 'simple-json',
  })
  inputs!: Input[]

  @Column({
    type: 'simple-json',
  })
  outputs!: Cell[]

  @Column({
    type: 'varchar',
  })
  timestamp!: string

  @Column({
    type: 'varchar',
  })
  value!: string
}

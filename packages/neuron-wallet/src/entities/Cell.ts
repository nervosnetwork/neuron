import { Entity, BaseEntity, Column, PrimaryColumn } from 'typeorm'
import { Script } from '../cell'

@Entity()
export default class Cell extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  outPointHash!: string

  @PrimaryColumn({
    type: 'int',
  })
  outPointIndex!: number

  @Column({
    type: 'varchar',
  })
  capacity!: string

  @Column({
    type: 'text',
  })
  data!: string

  @Column({
    type: 'simple-json',
  })
  lockScript!: Script

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  typeScript: Script | null = null
}

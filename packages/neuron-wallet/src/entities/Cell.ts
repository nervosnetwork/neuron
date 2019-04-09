import { Entity, BaseEntity, Column, PrimaryColumn } from 'typeorm'

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
    type: 'bigint',
  })
  capacity!: bigint

  @Column({
    type: 'text',
  })
  data!: string

  // JSON.stringify
  @Column({
    type: 'text',
  })
  lockScript!: string

  // JSON.stringify
  @Column({
    type: 'text',
    nullable: true,
  })
  typeScript: string | null = null
}

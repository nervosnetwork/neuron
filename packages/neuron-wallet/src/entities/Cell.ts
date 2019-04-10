import { Entity, BaseEntity, Column, PrimaryColumn } from 'typeorm'
import { Script, OutPoint } from '../cell'

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

  @Column({
    type: 'varchar',
  })
  status!: string

  public outPoint(): OutPoint {
    return {
      hash: this.outPointHash,
      index: this.outPointIndex,
    }
  }
}

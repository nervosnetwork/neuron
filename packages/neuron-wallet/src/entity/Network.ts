import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique } from 'typeorm'

@Entity()
@Unique(['name'])
export default class Network extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column()
  remote!: string
}

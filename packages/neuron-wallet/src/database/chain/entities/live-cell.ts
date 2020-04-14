import {Column, Entity, Index, PrimaryColumn, BaseEntity} from "typeorm"

@Entity()
export default class LiveCell extends BaseEntity {
  @Column({
    type: "character",
    length: 32,
  })
  @PrimaryColumn()
  txHash!: Buffer

  @Column({
    type: "varchar",
    length: 20,
  })
  @Index()
  createdBlockNumber!: string

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
  })
  @Index()
  usedBlockNumber?: string | null = null

  @Column({
    type: "integer",
  })
  @PrimaryColumn()
  outputIndex!: number

  @Column({
    type: "varchar",
  })
  capacity!: string

  @Column({
    type: "character",
    length: 32,
  })
  @Index()
  lockHash!: Buffer

  // 1 = data, 2 = type
  @Column({
    type: "character",
    length: 1,
  })
  @Index()
  lockHashType!: string

  @Column({
    type: "character",
    length: 32,
  })
  @Index()
  lockCodeHash!: Buffer

  @Column({
    type: "varchar",
  })
  lockArgs!: Buffer

  @Column({
    type: "character",
    length: 32,
    nullable: true,
  })
  @Index()
  typeHash: Buffer | null = null

  // 1 = data, 2 = type
  @Column({
    type: "character",
    length: 1,
    nullable: true,
  })
  @Index()
  typeHashType: string | null = null

  @Column({
    type: "character",
    length: 32,
    nullable: true,
  })
  @Index()
  typeCodeHash: Buffer | null = null

  @Column({
    type: "varchar",
    nullable: true,
  })
  typeArgs: Buffer | null = null

  @Column({
    type: "varchar",
    length: 64,
  })
  data!: Buffer
}

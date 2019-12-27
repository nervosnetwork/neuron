import { Entity, BaseEntity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import Transaction from './transaction'
import OutPoint from 'models/chain/out-point'
import { Input as InputModel } from 'models/chain/input'
import { ScriptInterface } from 'models/chain/script'

// cellbase input may have same OutPoint
@Entity()
export default class Input extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  // cellbase input has empty cell { txHash, index }
  @Column({
    type: 'varchar',
    nullable: true,
  })
  outPointTxHash: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  outPointIndex: string | null = null

  @Column({
    type: 'varchar',
  })
  since!: string

  @Column({
    type: 'varchar',
    nullable: true,
  })
  lockHash: string | null = null

  // cellbase input has no previous output lock script
  @Column({
    type: 'simple-json',
    nullable: true,
  })
  lock: ScriptInterface | null = null

  @ManyToOne(_type => Transaction, transaction => transaction.inputs, { onDelete: 'CASCADE' })
  transaction!: Transaction

  @Column({
    type: 'varchar',
    nullable: true,
  })
  capacity: string | null = null

  @Column({
    type: 'varchar',
    nullable: true,
  })
  inputIndex: string | null = null

  public previousOutput(): OutPoint | null {
    if (!this.outPointTxHash || !this.outPointIndex) {
      return null
    }
    return new OutPoint({
      txHash: this.outPointTxHash,
      index: this.outPointIndex,
    })
  }

  public toInterface(): InputModel {
    return new InputModel({
      previousOutput: this.previousOutput(),
      capacity: this.capacity,
      lockHash: this.lockHash,
      lock: this.lock,
    })
  }
}

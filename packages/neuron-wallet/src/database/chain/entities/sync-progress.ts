import { HexString } from '@ckb-lumos/base'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity({ name: 'sync_progress' })
export default class SyncProgress {
  @PrimaryColumn({ type: 'varchar' })
  hash!: string

  @Column({ type: 'varchar' })
  args!: string

  @Column({ type: 'varchar' })
  codeHash!: string

  @Column({ type: 'varchar' })
  hashType!: CKBComponents.ScriptHashType

  @Column()
  scriptType!: CKBRPC.ScriptType

  @Column({ type: 'varchar' })
  walletId!: string

  @Column()
  blockStartNumber: number = 0

  @Column()
  blockEndNumber: number = 0

  @Column({ type: 'varchar' })
  cursor?: HexString

  @Column({ type: 'boolean' })
  delete: boolean = false

  static fromObject(obj: { script: CKBComponents.Script; scriptType: CKBRPC.ScriptType; walletId: string }) {
    const res = new SyncProgress()
    res.hash = scriptToHash(obj.script)
    res.args = obj.script.args
    res.codeHash = obj.script.codeHash
    res.hashType = obj.script.hashType
    res.walletId = obj.walletId
    res.scriptType = obj.scriptType
    res.delete = false
    return res
  }
}

import { HexString } from '@ckb-lumos/lumos'
import { computeScriptHash as scriptToHash } from '@ckb-lumos/lumos/utils'
import { Entity, PrimaryColumn, Column } from 'typeorm'

export enum SyncAddressType {
  Default,
  Multisig,
}

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

  @PrimaryColumn({ type: 'varchar' })
  walletId!: string

  @Column()
  lightStartBlockNumber: number = 0

  @Column()
  localSavedBlockNumber: number = 0

  @Column()
  syncedBlockNumber: number = 0

  @Column({ type: 'varchar' })
  cursor?: HexString

  @Column({ type: 'boolean' })
  delete: boolean = false

  @Column()
  addressType: SyncAddressType = SyncAddressType.Default

  static fromObject(obj: {
    script: CKBComponents.Script
    scriptType: CKBRPC.ScriptType
    walletId: string
    addressType?: SyncAddressType
    blockNumber: string
  }) {
    const res = new SyncProgress()
    res.hash = scriptToHash(obj.script)
    res.args = obj.script.args
    res.codeHash = obj.script.codeHash
    res.hashType = obj.script.hashType
    res.walletId = obj.walletId
    res.scriptType = obj.scriptType
    res.delete = false
    res.addressType = obj.addressType ?? SyncAddressType.Default
    res.lightStartBlockNumber = parseInt(obj.blockNumber)
    res.localSavedBlockNumber = parseInt(obj.blockNumber)
    res.syncedBlockNumber = parseInt(obj.blockNumber)
    return res
  }
}

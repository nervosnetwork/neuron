import { SyncAddressType } from '../../database/chain/entities/sync-progress'
import { Subject } from 'rxjs'

export interface BlockTips {
  cacheTipNumber: number
  indexerTipNumber: number | undefined
}

export interface LumosCellQuery {
  lock: CKBComponents.Script | null
  type: CKBComponents.Script | null
  data: string | null
}

export interface LumosCell {
  blockHash: string
  outPoint: {
    txHash: string
    index: string
  }
  cellOutput: {
    capacity: string
    lock: {
      codeHash: string
      args: string
      hashType: string
    }
    type?: {
      codeHash: string
      args: string
      hashType: string
    }
  }
  data?: string
}

export interface AppendScript {
  walletId: string
  script: CKBComponents.Script
  addressType: SyncAddressType
  scriptType: CKBRPC.ScriptType
}

export abstract class Connector<TransactionsSubjectParam = unknown> {
  abstract blockTipsSubject: Subject<BlockTips>
  abstract transactionsSubject: Subject<{ txHashes: CKBComponents.Hash[]; params: TransactionsSubjectParam }>

  abstract connect(): Promise<void>
  abstract notifyCurrentBlockNumberProcessed(param: TransactionsSubjectParam): void
  abstract stop(): void
  abstract getLiveCellsByScript(query: LumosCellQuery): Promise<unknown>
  async appendScript(_scripts: AppendScript[]) {
    // do nothing
  }
}

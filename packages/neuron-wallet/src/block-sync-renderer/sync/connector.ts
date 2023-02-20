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

export abstract class Connector<T = unknown> {
  abstract blockTipsSubject: Subject<BlockTips>
  abstract transactionsSubject: Subject<{ txHashes: CKBComponents.Hash[]; params: T }>

  abstract connect(): Promise<void>
  abstract notifyCurrentBlockNumberProcessed(param: T): void
  abstract stop(): void
  abstract getLiveCellsByScript(query: LumosCellQuery): Promise<unknown>
}

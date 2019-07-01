// define types in app

export interface Block {
  header: BlockHeader
  transactions: Transaction[]
}

export interface BlockHeader {
  version: string
  timestamp: string
  hash: string
  parentHash: string
  number: string
}

export enum TransactionStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export interface TransactionWithoutHash {
  version: string
  deps?: OutPoint[]
  inputs?: Input[]
  outputs?: Cell[]
  timestamp?: string
  value?: string
  blockNumber?: string
  blockHash?: string
  witnesses?: Witness[]
  type?: string
  description?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface Transaction extends TransactionWithoutHash {
  hash: string
}

export interface Input {
  previousOutput: OutPoint
  since?: string
  capacity?: string | null
  lockHash?: string | null
  lock?: Script
}

export interface Witness {
  data: string[]
}

export interface Cell {
  capacity: string
  data?: string
  lock: Script
  type?: Script | null
  outPoint?: OutPoint
  status?: string
  lockHash?: string
}

export interface OutPoint {
  blockHash?: string | null
  cell?: CellOutPoint | null
}

export interface CellOutPoint {
  txHash: string
  index: string
}

export interface Script {
  args?: string[]
  codeHash?: string | null
}

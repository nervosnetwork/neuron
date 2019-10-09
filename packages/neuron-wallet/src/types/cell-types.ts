// define types in app

export enum ScriptHashType {
  Data = 'data',
  Type = 'type',
}

export enum DepType {
  Code = 'code',
  DepGroup = 'depGroup',
}

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

export interface CellDep {
  outPoint?: OutPoint | null
  depType: DepType
}

export interface TransactionWithoutHash {
  version: string
  cellDeps?: CellDep[]
  headerDeps?: string[]
  inputs?: Input[]
  outputs?: Cell[]
  outputsData?: string[]
  timestamp?: string
  value?: string
  blockNumber?: string
  blockHash?: string
  witnesses?: string[]
  type?: string
  description?: string
  status?: TransactionStatus
  createdAt?: string
  updatedAt?: string
}

export interface Transaction extends TransactionWithoutHash {
  hash: string
}

export interface Input {
  previousOutput: OutPoint | null
  since?: string
  capacity?: string | null
  lockHash?: string | null
  lock?: Script
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
  txHash: string
  index: string
}

export interface Script {
  args?: string
  codeHash?: string | null
  hashType: ScriptHashType
}

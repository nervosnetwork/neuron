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

export interface WitnessArgs {
  lock: string | undefined
  inputType: string | undefined
  outputType: string | undefined
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
  witnessArgs?: WitnessArgs[]
}

export interface Transaction extends TransactionWithoutHash {
  hash: string
}

export interface WitnessArgs {
  lock: string | undefined
  inputType: string | undefined
  outputType: string | undefined
}

export interface TxStatus {
  blockHash: string | null
  status: 'pending' | 'proposed' | 'committed'
}

export interface TransactionWithStatus {
  transaction: Transaction
  txStatus: TxStatus
}

export interface Input {
  previousOutput: OutPoint | null
  since?: string
  capacity?: string | null
  lockHash?: string | null
  lock?: Script | null
}

export interface Cell {
  capacity: string
  data?: string
  lock: Script
  type?: Script | null
  outPoint?: OutPoint
  status?: string
  lockHash?: string
  typeHash?: string | null
  daoData?: string | null
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

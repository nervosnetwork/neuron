// define types in app

export interface Block {
  header: BlockHeader
  transactions: Transaction[]
}

export interface BlockHeader {
  version: number
  timestamp: string
  hash: string
  parentHash: string
  number: string
}

export interface TransactionWithoutHash {
  version: number
  deps?: OutPoint[]
  inputs?: Input[]
  outputs?: Cell[]
  timestamp?: string
  value?: string
  blockNumber?: string
  blockHash?: string
  witnesses?: Witness[]
  type?: string
}

export interface Transaction extends TransactionWithoutHash {
  hash: string
}

export interface Input {
  previousOutput: OutPoint
  args: string[]
  since?: string
  capacity?: string | null
  lockHash?: string | null
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
  txHash: string
  index: number
}

export interface Script {
  args?: string[]
  codeHash?: string | null
}

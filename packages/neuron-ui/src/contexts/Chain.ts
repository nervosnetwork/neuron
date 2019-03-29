import { createContext } from 'react'
import { NetworkStatus, TransactionType } from '../utils/const'

// these will be introduced by sdk
export interface Cell {
  capacity: number
  data: Uint8Array
  lock: string
  type?: {
    version: number
    args: Uint8Array[]
    signedArgs: Uint8Array[]
    reference: string
    binary: Uint8Array
  }
  outPoint: {
    hash: string
    index: number
  }
}

// will be introduced by sdk
export interface Transaction {
  type: TransactionType
  date: Date
  value: string
  hash: string
}
export interface Network {
  id?: string
  name: string
  remote: string
  status?: NetworkStatus
}

export interface Chain {
  cells: Cell[]
  network: Network
  tipBlockNumber?: number
  transaction: Transaction
  transactions: {
    pageNo: number
    pageSize: number
    totalCount: number
    items: Transaction[]
    addresses: string[]
  }
}

export const initChain: Chain = {
  cells: [],
  network: {
    id: '',
    name: '',
    remote: '',
    status: NetworkStatus.Offline,
  },
  tipBlockNumber: undefined,
  transaction: {
    value: '',
    hash: '',
    type: TransactionType.Other,
    date: new Date(0),
  },
  transactions: {
    pageNo: -1,
    pageSize: 15,
    totalCount: 0,
    items: [],
    addresses: [],
  },
}

const ChainContext = createContext<Chain>(initChain)
export default ChainContext

import { createContext } from 'react'
import { NetworkStatus } from '../utils/const'

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
  date: Date
  value: string
  hash: string
}
export interface Network {
  name: string
  remote: string
  status: NetworkStatus
}

export interface Chain {
  cells: Cell[]
  network: Network
  tipBlockNumber?: number
  transactions: {
    pageNo: number
    pageSize: number
    totalCount: number
    items: Transaction[]
  }
}

export const initChain: Chain = {
  cells: [],
  network: {
    name: '',
    remote: '',
    status: NetworkStatus.Offline,
  },
  tipBlockNumber: undefined,
  transactions: {
    pageNo: 0,
    pageSize: 15,
    totalCount: 0,
    items: [],
  },
}

const ChainContext = createContext<Chain>(initChain)
export default ChainContext

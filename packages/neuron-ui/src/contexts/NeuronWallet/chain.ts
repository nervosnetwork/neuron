import { RawNetwork } from 'components/NetworkEditor'
import { ConnectStatus } from 'utils/const'

export interface Transaction {
  type: 'send' | 'receive' | 'other'
  createdAt: string
  updatedAt: string
  timestamp: string
  value: string
  hash: string
  description: string
  status: 'pending' | 'success' | 'failed'
}

interface DetailedTransaction extends Transaction {
  blockHash: string
  blockNumber: string
  deps: any[]
  inputs: {
    capacity: string | null
    lockHash: string | null
    previousOutput: {
      blockHash: string | null
      cell: { txHash: string; index: string } | null
    }
  }[]
  outputs: {
    capacity: string
    lock: {
      args: string[]
      codeHash: string
    }
    lockHash: string
    outPoint: {
      blockHash: string | null
      cell: {
        index: string
        txHash: string
      }
    }
  }[]
  witnesses: string[]
}

export interface Network extends RawNetwork {
  id: string
}

export interface Chain {
  networkId: string
  connectStatus: ConnectStatus
  tipBlockNumber?: number
  transaction: DetailedTransaction
  transactions: {
    pageNo: number
    pageSize: number
    totalCount: number
    items: Transaction[]
    keywords: string
  }
}

const chainState: Chain = {
  networkId: '',
  connectStatus: ConnectStatus.Offline,
  tipBlockNumber: undefined,
  transaction: {
    value: '',
    hash: '',
    type: 'other',
    createdAt: '0',
    updatedAt: '0',
    timestamp: '0',
    description: '',
    status: 'pending',
    inputs: [],
    outputs: [],
    deps: [],
    blockNumber: '',
    blockHash: '',
    witnesses: [],
  },
  transactions: {
    pageNo: 1,
    pageSize: 15,
    totalCount: 0,
    items: [],
    keywords: '',
  },
}

export default chainState

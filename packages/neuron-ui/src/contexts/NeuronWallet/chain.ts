import { RawNetwork } from 'components/NetworkEditor'
import { ConnectStatus, TransactionType } from 'utils/const'

export interface Transaction {
  type: TransactionType
  timestamp: number
  value: string
  hash: string
  description: string
}

export interface Network extends RawNetwork {
  id: string
}

export interface Chain {
  networkId: string
  connectStatus: ConnectStatus
  tipBlockNumber?: number
  transaction: Transaction
  transactions: {
    pageNo: number
    pageSize: number
    totalCount: number
    items: Transaction[]
  }
}

const chainState: Chain = {
  networkId: '',
  connectStatus: ConnectStatus.Offline,
  tipBlockNumber: undefined,
  transaction: {
    value: '',
    hash: '',
    type: TransactionType.Other,
    timestamp: +new Date(0),
    description: '',
  },
  transactions: {
    pageNo: 1,
    pageSize: 15,
    totalCount: 0,
    items: [],
  },
}

export default chainState

import { ConnectStatus, TransactionType } from '../../utils/const'
import { RawNetwork } from '../../components/NetworkEditor'

export interface Transaction {
  type: TransactionType
  time: number
  value: string
  hash: string
}

export interface Network extends RawNetwork {
  id: string
}

export interface Chain {
  network: Network
  connectStatus: ConnectStatus
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

const chainState: Chain = {
  network: {
    id: '',
    name: '',
    remote: '',
  },
  connectStatus: ConnectStatus.Offline,
  tipBlockNumber: undefined,
  transaction: {
    value: '',
    hash: '',
    type: TransactionType.Other,
    time: +new Date(0),
  },
  transactions: {
    pageNo: -1,
    pageSize: 15,
    totalCount: 0,
    items: [],
    addresses: [],
  },
}

export default chainState

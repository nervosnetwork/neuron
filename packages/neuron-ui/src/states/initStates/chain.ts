import { currentNetworkID, systemScript } from 'services/localCache'
import { ConnectionStatus } from 'utils/const'

export const transactionState: State.DetailedTransaction = {
  value: '',
  hash: '',
  type: 'receive',
  createdAt: '0',
  updatedAt: '0',
  timestamp: '0',
  description: '',
  status: 'pending',
  inputs: [],
  inputsCount: '0',
  outputs: [],
  outputsCount: '0',
  deps: [],
  blockNumber: '',
  blockHash: '',
  witnesses: [],
  nervosDao: false,
}

const chainState: State.Chain = {
  networkID: currentNetworkID.load(),
  connectionStatus: ConnectionStatus.Offline,
  tipBlockNumber: '',
  codeHash: systemScript.load().codeHash,
  transactions: {
    pageNo: 1,
    pageSize: 15,
    totalCount: 0,
    items: [],
    keywords: '',
  },
}

export default chainState

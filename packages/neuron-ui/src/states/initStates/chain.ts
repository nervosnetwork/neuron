import { currentNetworkID, systemScript } from 'utils/localCache'
import { ConnectionStatus } from 'utils/const'

const chainState: State.Chain = {
  networkID: currentNetworkID.load(),
  connectionStatus: ConnectionStatus.Offline,
  tipBlockNumber: '',
  codeHash: systemScript.load().codeHash,
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

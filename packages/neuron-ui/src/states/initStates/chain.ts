const chainState: State.Chain = {
  networkID: '',
  connectStatus: 'offline',
  tipBlockNumber: '',
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

import { Cell } from './services/cells'

// mock as cells in db
export const storeCells: Cell[] = [
  {
    outPoint: {
      hash: '0x3abd21e6e51674bb961bb4c5f3cee9faa5da30e64be10628dc1cef292cbae324',
      index: 0,
    },
    status: 'live',
    // origin cell infos
    data: '0x',
    capacity: '10',
    type: null,
    lock: {},
  },
  {
    outPoint: {
      hash: '0xb22b53a7613f5754850f118eae16caf867107d72a9b125ca596855583e712c97',
      index: 0,
    },
    status: 'dead',
    // origin cell infos
    data: '0x',
    capacity: '20',
    type: null,
    lock: {},
  },
]

// mock an interface: get cell change info from chain
// stateChange should be 'created' or 'spent'
// params: [lockHashes, beginBlockNumber, endBlockNumber]
export const getLiveCells = async () => {
  const cells: Cell[] = [
    {
      outPoint: {
        hash: '0x3abd21e6e51674bb961bb4c5f3cee9faa5da30e64be10628dc1cef292cbae324',
        index: 0,
      },
      // origin cell infos
      data: '0x',
      capacity: '10',
      type: null,
      lock: {},
    },
    {
      outPoint: {
        hash: '0xb22b53a7613f5754850f118eae16caf867107d72a9b125ca596855583e712c97',
        index: 0,
      },
      // origin cell infos
      data: '0x',
      capacity: '20',
      type: null,
      lock: {},
    },
  ]

  return cells
}

const randomHexChar = (): string => {
  const i = Math.round(Math.random() * 14)
  return i.toString(16)
}

export const randomHexString = (size: number = 64): string => {
  return Array.from({
    length: size,
  })
    .map(() => randomHexChar())
    .join('')
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
// WIP
// mock an interface: get history transactions from chain
// related address may in inputs or outputs(such as input and return change)
// params: [lockHashes, fromBlock, toBlock]
export const getHistoryTransactions = async (_lockHashes: string[], _from: string, _to: string) => {
  const length = 100
  const currentTimestamp = new Date().getTime()

  const transactions = Array.from({
    length,
  }).map((_, index) => ({
    timestamp: `${currentTimestamp - (length - index) * 100000000}`,
    hash: `0x${randomHexString()}`,
    version: 0,
    blockNumber: index.toString(),
    blockHash: `0x${randomHexString()}`,
    inputs: [],
    outputs: [],
    deps: [],
    witnesses: [],
  }))

  return transactions
}

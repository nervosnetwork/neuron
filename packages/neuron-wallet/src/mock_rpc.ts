import { Cell } from './cell'

// mock as cells in db
export const storeCells: Cell[] = [
  {
    outPoint: {
      hash: '0x3abd21e6e51674bb961bb4c5f3cee9faa5da30e64be10628dc1cef292cbae324',
      index: 0,
    },
    state: 'live',
    // origin cell infos
    data: '0x',
    capacity: 10,
    type: null,
    lock: '0x84aa24c0f4e70ca4fb559a31abdb237a74f3106ed57510579043348984fc1478',
  },
  {
    outPoint: {
      hash: '0xb22b53a7613f5754850f118eae16caf867107d72a9b125ca596855583e712c97',
      index: 0,
    },
    state: 'dead',
    // origin cell infos
    data: '0x',
    capacity: 20,
    type: null,
    lock: '0xa4ce51d3c7e26701d4249179546f405d7a5ac24ffb3f2f6b8bef15017161e2e5',
  },
]

// mock an interface: get cell change info from chain
// stateChange should be 'created' or 'spent'
// params: [addresses, beginBlockNumber, endBlockNumber]
export const getCellChanges = async () => {
  const cells: Cell[] = [
    {
      outPoint: {
        hash: '0x3abd21e6e51674bb961bb4c5f3cee9faa5da30e64be10628dc1cef292cbae324',
        index: 0,
      },
      stateChange: 'created',
      // origin cell infos
      data: '0x',
      capacity: 10,
      type: null,
      lock: '0x84aa24c0f4e70ca4fb559a31abdb237a74f3106ed57510579043348984fc1478',
    },
    {
      outPoint: {
        hash: '0xb22b53a7613f5754850f118eae16caf867107d72a9b125ca596855583e712c97',
        index: 0,
      },
      stateChange: 'spent',
      // origin cell infos
      data: '0x',
      capacity: 20,
      type: null,
      lock: '0xa4ce51d3c7e26701d4249179546f405d7a5ac24ffb3f2f6b8bef15017161e2e5',
    },
  ]

  return cells
}

// WIP
// mock an interface: get history transactions from chain
// related address may in inputs or outputs(such as input and return change)
// params: [addresses]
export const getHistoryTransactions = async () => {
  return [
    {
      deps: [],
      hash: '0x03027d3cec6ba03a5c363879b20af806bdf955e17d75bc81cde5a91b56c13f17',
      inputs: [],
      outputs: [],
      version: 0,
      blockHash: '0xdbe33b04110a87ad72d1ba8aaada764bbdbc635a0944debd3c1c2fedde1685d1',
      timestamp: '1545992487397',
    },
  ]
}

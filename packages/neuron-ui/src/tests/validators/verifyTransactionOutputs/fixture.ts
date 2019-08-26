const fixtures: {
  [title: string]: {
    outputs: { address: string; amount: string }[]
    expected: boolean
  }
} = {
  'valid address and valid amount': {
    outputs: [
      {
        address: 'ckt1qyqg5w7emdntvnnk7utzqkz3kx276um0j4qs525t0y',
        amount: '100',
      },
    ],
    expected: true,
  },
  'empty address and valid amount': {
    outputs: [
      {
        address: '',
        amount: '100',
      },
    ],
    expected: false,
  },
  'invalid address and valid amount': {
    outputs: [
      {
        address: 'abcdefg',
        amount: '100',
      },
    ],
    expected: false,
  },
  'valid address and amount of invalid number': {
    outputs: [
      {
        address: 'abcdefg',
        amount: 'invalid number',
      },
    ],
    expected: false,
  },
  'valid address and negative amount': {
    outputs: [
      {
        address: 'abcdefg',
        amount: '-1',
      },
    ],
    expected: false,
  },
  'valid address and amount less than 61': {
    outputs: [
      {
        address: 'abcdefg',
        amount: '60',
      },
    ],
    expected: false,
  },
}

export default fixtures

const fixtures: {
  [title: string]: {
    outputs: { address: string; amount: string }[]
    expected: boolean
  }
} = {
  'Valid address and valid amount': {
    outputs: [
      {
        address: 'ckt1qyqg5w7emdntvnnk7utzqkz3kx276um0j4qs525t0y',
        amount: '100',
      },
    ],
    expected: true,
  },
  'Empty address and valid amount should fail': {
    outputs: [
      {
        address: '',
        amount: '100',
      },
    ],
    expected: false,
  },
  'Invalid address and valid amount should fail': {
    outputs: [
      {
        address: 'abcdefg',
        amount: '100',
      },
    ],
    expected: false,
  },
  'Valid address and amount of invalid number should fail': {
    outputs: [
      {
        address: 'abcdefg',
        amount: 'invalid number',
      },
    ],
    expected: false,
  },
  'Valid address and negative amount should fail': {
    outputs: [
      {
        address: 'abcdefg',
        amount: '-1',
      },
    ],
    expected: false,
  },
  'Valid address and amount less than 61 should fail': {
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

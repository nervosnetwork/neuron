const fixtures: {
  [title: string]: {
    addresses: {
      balance: string | undefined
    }[]
    expected: string
  }
} = {
  basic: {
    addresses: [
      {
        balance: '100',
      },
      {
        balance: '10000',
      },
      {
        balance: '200',
      },
      {
        balance: '10000',
      },
    ],
    expected: '20300',
  },
  'number large than MAX SAFE INTEGER': {
    addresses: [
      {
        balance: '100',
      },
      {
        balance: '10000',
      },
      {
        balance: '200',
      },
      {
        balance: '100000000000000000000000000000000000000000000000000000000000',
      },
    ],
    expected: '100000000000000000000000000000000000000000000000000000010300',
  },
  'address has negative balance': {
    addresses: [
      {
        balance: '-100',
      },
      {
        balance: '10000',
      },
      {
        balance: '200',
      },
      {
        balance: '100000000000000000000000000000000000000000000000000000000000',
      },
    ],
    expected: '100000000000000000000000000000000000000000000000000000010100',
  },
  'address has undefined balance': {
    addresses: [
      {
        balance: undefined,
      },
      {
        balance: '10000',
      },
      {
        balance: '200',
      },
      {
        balance: '100000000000000000000000000000000000000000000000000000000000',
      },
    ],
    expected: '100000000000000000000000000000000000000000000000000000010200',
  },
}

export default fixtures

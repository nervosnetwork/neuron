const fixtures: {
  [title: string]: {
    totalAmount: string
    fee: string
    balance: string
    expected: boolean
  }
} = {
  'Valid total amount': {
    totalAmount: '10000000000000000000000',
    fee: '1',
    balance: '10000000000000000000001',
    expected: true,
  },
  'Too large total amount should fail': {
    totalAmount: '10000000000000000000001',
    fee: '0',
    balance: '10000000000000000000000',
    expected: false,
  },
  'Too large fee should fail': {
    totalAmount: '10000000000000000000000',
    fee: '1',
    balance: '10000000000000000000000',
    expected: false,
  },
  'Negative balance should fail': {
    totalAmount: '10000000000000000000000',
    fee: '10000000000',
    balance: '-10000000000010000000000',
    expected: false,
  },
}

export default fixtures

const fixtures: {
  [title: string]: {
    outputs: {
      amount: string
      unit: 'CKB'
    }[]
    expected: string
  }
} = {
  basic: {
    outputs: [
      {
        amount: '100',
        unit: 'CKB',
      },
      {
        amount: '10000',
        unit: 'CKB',
      },
      {
        amount: '200',
        unit: 'CKB',
      },
      {
        amount: '10000',
        unit: 'CKB',
      },
    ],
    expected: '20300',
  },
  'amount large than MAX SAFE INTEGER': {
    outputs: [
      {
        amount: '100',
        unit: 'CKB',
      },
      {
        amount: '10000',
        unit: 'CKB',
      },
      {
        amount: '200',
        unit: 'CKB',
      },
      {
        amount: '10000000000000000000000000000000000000000000000000000000000000000000',
        unit: 'CKB',
      },
    ],
    expected: '10000000000000000000000000000000000000000000000000000000000000010300',
  },
}
export default fixtures

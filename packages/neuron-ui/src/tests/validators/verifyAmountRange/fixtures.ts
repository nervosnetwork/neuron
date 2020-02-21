export default {
  'Amount of 0 should fail': {
    amount: '0',
    extraSize: 0,
    expected: false,
  },
  'Amount of 60.99999999 should fail': {
    amount: '60.99999999',
    extraSize: 0,
    expected: false,
  },
  'Amount equals to 61 should pass': {
    amount: '61',
    extraSize: 0,
    expected: true,
  },
  'Amount close to 61.00000001 should pass': {
    amount: '61.00000001',
    extraSize: 0,
    expected: true,
  },
  'Amount far away from 61 should pass': {
    amount: '6100000001',
    extraSize: 0,
    expected: true,
  },
  '61 amount and 1 extraSize should fail': {
    amount: '61',
    extraSize: 1,
    expected: false,
  },
  '62 amount and 1 extraSize should pass': {
    amount: '62',
    extraSize: 1,
    expected: true,
  },
}

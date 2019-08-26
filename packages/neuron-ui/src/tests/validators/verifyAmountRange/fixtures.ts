export default {
  'Amount of 0': {
    amount: '0',
    expected: false,
  },
  'Amount of 60.99999999': {
    amount: '60.99999999',
    expected: false,
  },
  'Amount equals to 61': {
    amount: '61',
    expected: true,
  },
  'Amount close to 61.00000001': {
    amount: '61.00000001',
    expected: true,
  },
  'Amount far away from 61': {
    amount: '6100000001',
    expected: true,
  },
}

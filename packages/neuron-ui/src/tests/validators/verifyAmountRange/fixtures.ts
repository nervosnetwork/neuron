export default {
  'amount of 0': {
    amount: '0',
    expected: false,
  },
  'amount of 60.99999999': {
    amount: '60.99999999',
    expected: false,
  },
  'amount equals to 61': {
    amount: '61',
    expected: true,
  },
  'amount close to 61.00000001': {
    amount: '61.00000001',
    expected: true,
  },
  'amount far away from 61': {
    amount: '6100000001',
    expected: true,
  },
}

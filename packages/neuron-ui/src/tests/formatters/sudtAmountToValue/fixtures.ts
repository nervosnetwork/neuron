export default {
  '0 decimal': {
    amount: '1',
    decimal: '0',
    expected: '1',
  },
  '1 decimal': {
    amount: '0.1',
    decimal: '1',
    expected: '1',
  },
  '32 decimal': {
    amount: '1.00000000000000000000000000000001',
    decimal: '32',
    expected: '100000000000000000000000000000001',
  },
}

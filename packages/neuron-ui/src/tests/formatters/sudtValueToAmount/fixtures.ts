export default {
  '0 decimal': {
    value: '1',
    decimal: '0',
    expected: '1',
  },
  '1 decimal': {
    value: '1',
    decimal: '1',
    expected: '0.1',
  },
  '32 decimal': {
    value: '100000000000000000000000000000001',
    decimal: '32',
    expected: '1.00000000000000000000000000000001',
  },
}

export default {
  'invalid value': {
    value: 'ckb',
    decimal: '0',
    expected: '0',
  },
  'null value': {
    value: null,
    decimal: '0',
    expected: '0',
  },
  '0 decimal': {
    value: '12345',
    decimal: '0',
    expected: '12,345',
  },
  '1 decimal': {
    value: '1',
    decimal: '1',
    expected: '0.1',
  },
  '2 decimal': {
    value: '1234567890',
    decimal: '2',
    expected: '12,345,678.9',
  },
  '32 decimal': {
    value: '100000000000000000000000000000001',
    decimal: '32',
    expected: '1.00000000000000000000000000000001',
  },
  '32 decimal and commas': {
    value: '12345678900000000000000000000000000000001',
    decimal: '32',
    expected: '123,456,789.00000000000000000000000000000001',
  },
}

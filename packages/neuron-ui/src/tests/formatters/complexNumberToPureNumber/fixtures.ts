const fixtures = [
  {
    value: `1.23456789 CKB`,
    expected: 1.23456789,
  },
  {
    value: `1234567890`,
    expected: 1234567890,
  },
  {
    value: `802,469.1285 CNY`,
    expected: 802469.1285,
  },
  {
    value: `-802,469.1285 CNY`,
    expected: -802469.1285,
  },
  {
    value: `1000,123,101.12`,
    expected: 1000123101.12,
  },
  {
    value: `1000,123,101.12 CKB`,
    expected: 1000123101.12,
  },
  {
    value: `1000,123,101.00`,
    expected: 1000123101,
  },
  {
    value: `-1000,123,101.00`,
    expected: -1000123101,
  },
  {
    value: `&%^$#`,
    expected: 0,
  },
]
export default fixtures

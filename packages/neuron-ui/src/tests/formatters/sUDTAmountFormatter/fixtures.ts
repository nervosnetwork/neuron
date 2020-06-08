const fixtures = [
  {
    amount: `123,456`,
    expected: `123,456`,
  },
  {
    amount: `123.4567891`,
    expected: `123.4567891`,
  },
  {
    amount: `1.12345678`,
    expected: `1.12345678`,
  },
  {
    amount: `1.123456789`,
    expected: `1.12345678...`,
  },
  {
    amount: `0.123456789123456789123456789123456789123456789`,
    expected: `0.12345678...`,
  },
]
export default fixtures

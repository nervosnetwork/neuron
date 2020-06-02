import shannonToCKB from '../../src/utils/shannonToCKB'

const fixtures: { shannon: bigint, expected: string }[] = [
  {
    shannon: BigInt(0),
    expected: '0.00000000'
  },
  {
    shannon: BigInt(1234567),
    expected: '+0.01234567'
  },
  {
    shannon: BigInt(-1234567),
    expected: '-0.01234567'
  },
  {
    shannon: BigInt(12345678),
    expected: '+0.12345678',
  },
  {
    shannon: BigInt(-12345678),
    expected: '-0.12345678',
  },
  {
    shannon: BigInt(123456789),
    expected: '+1.23456789',
  },
  {
    shannon: BigInt(-123456789),
    expected: '-1.23456789',
  },
  {
    shannon: BigInt(12345678900000000),
    expected: '+123456789.00000000'
  },
  {
    shannon: BigInt(-12345678900000000),
    expected: '-123456789.00000000'
  }

]

describe('Test Shannon To CKB', () => {
  const fixtureTable: [bigint, string][] = fixtures.map(fixture => [fixture.shannon, fixture.expected])
  test.each(fixtureTable)(`%s shannon => %s CKB`, (shannon, expected) => {
    const actual = shannonToCKB(shannon)
    expect(actual).toBe(expected)
  })
})

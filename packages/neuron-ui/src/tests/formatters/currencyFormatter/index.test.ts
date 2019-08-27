import { currencyFormatter } from 'utils/formatters'
import fixtures from './fixtures'

const fixtureTable = fixtures.map(({ value, expected }) => [value, expected])

describe(`Verify currency formatter`, () => {
  test.each(fixtureTable)(`%j => %s`, (value: any, expected: string) => {
    expect(currencyFormatter(value.shannons, value.unit, value.exchange)).toBe(expected)
  })
})

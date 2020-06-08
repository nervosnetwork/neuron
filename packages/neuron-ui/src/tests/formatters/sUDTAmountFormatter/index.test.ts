import { sUDTAmountFormatter } from 'utils/formatters'
import fixtures from './fixtures'

const fixtureTable = fixtures.map(({ amount, expected }) => [amount, expected])

describe(`Verify sUDT amount formatter`, () => {
  test.each(fixtureTable)(`%s => %s `, (amount: string, expected: string) => {
    expect(sUDTAmountFormatter(amount)).toBe(expected)
  })
})

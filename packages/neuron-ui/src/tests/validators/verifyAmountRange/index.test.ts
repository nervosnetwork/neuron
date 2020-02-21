import { verifyAmountRange } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { amount, extraSize, expected }]) => [
  title,
  amount,
  extraSize,
  expected,
])

describe('Verify amount range', () => {
  test.each(fixtureTable)(`%s`, (_title: string, amount: string, extraSize: number, expected: boolean) => {
    expect(verifyAmountRange(amount, extraSize)).toBe(expected)
  })
})

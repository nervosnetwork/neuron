import { verifyAmountRange } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { amount, expected }]) => [title, amount, expected])

describe('Verify amount range', () => {
  test.each(fixtureTable)(`%s`, (_title: string, amount: string, expected: boolean) => {
    expect(verifyAmountRange(amount)).toBe(expected)
  })
})

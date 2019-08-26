import { verifyAmount } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { amount, expected }]) => [title, amount, expected])

describe(`Verify amount`, () => {
  test.each(fixtureTable)(`%s, amount: %s, expected: %s`, (_title: string, amount: string, expected: boolean) => {
    expect(verifyAmount(amount)).toEqual(expected)
  })
})

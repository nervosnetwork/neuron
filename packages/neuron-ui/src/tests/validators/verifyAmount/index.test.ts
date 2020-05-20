import { verifyAmount } from 'utils/validators'
import { ErrorCode } from 'utils/enums'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { amount, expected }]) => [title, amount, expected])

describe(`Verify amount`, () => {
  test.each(fixtureTable)(`%s`, (_title: string, amount: string, expected: boolean | { code: ErrorCode }) => {
    expect(verifyAmount(amount)).toEqual(expected)
  })
})

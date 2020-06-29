import { validateAmountRange } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAmountRange>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params.amount, params.extraSize], exception])

describe('Verify amount range', () => {
  test.each(fixtureTable)(`%s`, (_title, [amount, extraSize], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateAmountRange(amount, extraSize)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateAmountRange(amount, extraSize)).toBeTruthy()
    }
  })
})

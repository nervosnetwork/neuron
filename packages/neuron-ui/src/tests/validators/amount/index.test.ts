import { validateAmount } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAmount>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params.amount], exception])

describe(`Test amount validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [amount], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateAmount(amount)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateAmount(amount)).toBeTruthy()
    }
  })
})

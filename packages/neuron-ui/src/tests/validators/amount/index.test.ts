import { isErrorWithI18n } from 'exceptions'
import { validateAmount } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAmount>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params.amount], exception]
)

describe(`Test amount validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [amount], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateAmount(amount)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateAmount(amount)).toBeTruthy()
    }
  })
})

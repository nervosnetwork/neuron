import { isErrorWithI18n } from 'exceptions'
import { validateTotalAmount } from 'utils/validators'

import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateTotalAmount>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params.totalAmount, params.fee, params.balance], exception]
)

describe(`Test total amount validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [totalAmount, fee, balance], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateTotalAmount(totalAmount, fee, balance)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateTotalAmount(totalAmount, fee, balance)).toBeTruthy()
    }
  })
})

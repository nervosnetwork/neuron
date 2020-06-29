import { validateTotalAmount } from 'utils/validators'

import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateTotalAmount>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params.totalAmount, params.fee, params.balance], exception])

describe(`Test total amount validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [totalAmount, fee, balance], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateTotalAmount(totalAmount, fee, balance)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateTotalAmount(totalAmount, fee, balance)).toBeTruthy()
    }
  })
})

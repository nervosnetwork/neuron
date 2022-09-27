import { isErrorWithI18n } from 'exceptions'
import { validateDecimal } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateDecimal>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe('Test decimal validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateDecimal(params)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateDecimal(params)).toBeTruthy()
    }
  })
})

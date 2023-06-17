import { isErrorWithI18n } from 'exceptions'
import { validateTokenName } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateTokenName>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params], exception]
)

describe('Test token name validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateTokenName(params)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateTokenName(params)).toBeTruthy()
    }
  })
})

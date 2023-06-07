import { isErrorWithI18n } from 'exceptions'
import { validatePasswordComplexity } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validatePasswordComplexity>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params.password], exception]
)

describe('Test password complexity validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [password], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validatePasswordComplexity(password)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validatePasswordComplexity(password)).toBeTruthy()
    }
  })
})

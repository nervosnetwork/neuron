import { isErrorWithI18n } from 'exceptions'
import { validateURL } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateURL>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params.url], exception])

describe('Test URL validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [url], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateURL(url)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateURL(url)).toBeTruthy()
    }
  })
})

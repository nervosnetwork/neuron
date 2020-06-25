import { validateURL } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateURL>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params.url], exception])

describe('Test URL validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [url], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateURL(url)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateURL(url)).toBeTruthy()
    }
  })
})

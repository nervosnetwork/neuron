import { validatePasswordComplexity } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validatePasswordComplexity>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params.password], exception])

describe('Test password complexity validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [password], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validatePasswordComplexity(password)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validatePasswordComplexity(password)).toBeTruthy()
    }
  })
})

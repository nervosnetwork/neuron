import { validateDecimal } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateDecimal>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe('Test decimal validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateDecimal(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateDecimal(params)).toBeTruthy()
    }
  })
})

import { validateTokenName } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateTokenName>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe('Test token name validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateTokenName(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateTokenName(params)).toBeTruthy()
    }
  })
})

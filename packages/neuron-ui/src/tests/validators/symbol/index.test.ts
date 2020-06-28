import { validateSymbol } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateSymbol>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe('Test symbol validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateSymbol(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateSymbol(params)).toBeTruthy()
    }
  })
})

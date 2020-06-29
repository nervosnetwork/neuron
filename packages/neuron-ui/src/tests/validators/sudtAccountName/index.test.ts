import { validateSUDTAccountName } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateSUDTAccountName>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe('Test sudt account name validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateSUDTAccountName(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateSUDTAccountName(params)).toBeTruthy()
    }
  })
})

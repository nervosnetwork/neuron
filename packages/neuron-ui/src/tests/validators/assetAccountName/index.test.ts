import { validateAssetAccountName } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAssetAccountName>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe('Test sudt account name validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateAssetAccountName(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateAssetAccountName(params)).toBeTruthy()
    }
  })
})

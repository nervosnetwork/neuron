import { validateAssetAccountAddress } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAssetAccountAddress>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe(`Test sudt address validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateAssetAccountAddress(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateAssetAccountAddress(params)).toBeTruthy()
    }
  })
})

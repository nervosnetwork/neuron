import { validateAssetAccountAmount } from 'utils/validators'

import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAssetAccountAmount>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe(`Test sudt amount validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateAssetAccountAmount(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateAssetAccountAmount(params)).toBeTruthy()
    }
  })
})

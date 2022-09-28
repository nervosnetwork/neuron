import { isErrorWithI18n } from 'exceptions'
import { validateAssetAccountName } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAssetAccountName>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe('Test sudt account name validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateAssetAccountName(params)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateAssetAccountName(params)).toBeTruthy()
    }
  })
})

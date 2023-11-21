import { describe, test, expect } from '@jest/globals'
import { isErrorWithI18n } from 'exceptions'
import { validateAssetAccountAddress } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAssetAccountAddress>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params], exception]
)

describe(`Test sudt address validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateAssetAccountAddress(params)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateAssetAccountAddress(params)).toBeTruthy()
    }
  })
})

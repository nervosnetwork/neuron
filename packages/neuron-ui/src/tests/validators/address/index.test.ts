import { describe, test, expect } from '@jest/globals'
import { isErrorWithI18n } from 'exceptions'
import { validateAddress } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAddress>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params.address, params.isMainnet], exception]
)

describe(`Test address validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [address, isMainnet], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateAddress(address, isMainnet)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateAddress(address, isMainnet)).toBeTruthy()
    }
  })
})

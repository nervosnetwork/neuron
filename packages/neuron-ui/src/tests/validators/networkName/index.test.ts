import { describe, test, expect } from 'vitest'
import { isErrorWithI18n } from 'exceptions'
import { validateNetworkName } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateNetworkName>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params.name, params.usedNames], exception]
)

describe(`Test network name validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [name, usedNames], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateNetworkName(name, usedNames)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateNetworkName(name, usedNames)).toBeTruthy()
    }
  })
})

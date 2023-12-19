import { describe, test, expect } from '@jest/globals'
import { isErrorWithI18n } from 'exceptions'
import { validateCapacity } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateCapacity>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params], exception]
)

describe(`Test capacity validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateCapacity(params)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateCapacity(params)).toBeTruthy()
    }
  })
})

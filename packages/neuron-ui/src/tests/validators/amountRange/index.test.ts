import { describe, test, expect } from '@jest/globals'
import { isErrorWithI18n } from 'exceptions'
import { validateAmountRange } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAmountRange>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params.amount, params.extraSize], exception]
)

describe('Verify amount range', () => {
  test.each(fixtureTable)(`%s`, (_title, [amount, extraSize], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateAmountRange(amount, extraSize)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateAmountRange(amount, extraSize)).toBeTruthy()
    }
  })
})

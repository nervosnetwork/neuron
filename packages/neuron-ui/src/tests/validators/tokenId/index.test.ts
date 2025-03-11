import { describe, test, expect } from 'vitest'
import { isErrorWithI18n } from 'exceptions'
import { validateTokenId } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateTokenId>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [title, [params], exception]
)

describe('Test token validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [tokenId], exception) => {
    if (exception) {
      expect.assertions(2)
      try {
        validateTokenId(tokenId)
      } catch (err) {
        expect(isErrorWithI18n(err)).toBeTruthy()
        expect((err as { code: number }).code).toBe(exception)
      }
    } else {
      expect.assertions(1)
      expect(validateTokenId(tokenId)).toBeTruthy()
    }
  })
})

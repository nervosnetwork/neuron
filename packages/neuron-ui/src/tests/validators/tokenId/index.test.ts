import { validateTokenId } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateTokenId>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe('Test token validator', () => {
  test.each(fixtureTable)(`%s`, (_title, [tokenId], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateTokenId(tokenId)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateTokenId(tokenId)).toBeTruthy()
    }
  })
})

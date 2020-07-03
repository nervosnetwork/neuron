import { validateSUDTAmount } from 'utils/validators'

import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateSUDTAmount>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe(`Test sudt amount validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateSUDTAmount(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateSUDTAmount(params)).toBeTruthy()
    }
  })
})

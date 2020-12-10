import { validateSUDTAddress } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateSUDTAddress>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params], exception])

describe(`Test sudt address validator`, () => {
  test.each(fixtureTable.slice(11, 12))(`%s`, (_title, [params], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateSUDTAddress(params)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateSUDTAddress(params)).toBeTruthy()
    }
  })
})

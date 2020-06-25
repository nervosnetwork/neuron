import { validateAddress } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateAddress>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params.address, params.isMainnet], exception])

describe(`Test address validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [address, isMainnet], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateAddress(address, isMainnet)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateAddress(address, isMainnet)).toBeTruthy()
    }
  })
})

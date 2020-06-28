import { validateNetworkName } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateNetworkName>[] = Object.entries(
  fixtures
).map(([title, { params, exception }]) => [title, [params.name, params.usedNames], exception])

describe(`Test network name validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [name, usedNames], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateNetworkName(name, usedNames)
      } catch (err) {
        expect(err.code).toBe(exception)
      }
    } else {
      expect(validateNetworkName(name, usedNames)).toBeTruthy()
    }
  })
})

import { validateOutputs } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable: Fixture.Validator<typeof validateOutputs, boolean>[] = Object.entries(fixtures).map(
  ([title, { params, exception }]) => [
    title,
    [params.outputs, params.ignoreLastAmount, params.ignoreLastAddress],
    exception,
  ]
)

describe(`Test outputs validator`, () => {
  test.each(fixtureTable)(`%s`, (_title, [outputs, ignoreLastAmount, ignoreLastAddress], exception) => {
    expect.assertions(1)
    if (exception) {
      try {
        validateOutputs(outputs, false, ignoreLastAmount, ignoreLastAddress)
      } catch (e) {
        expect(e).not.toBeUndefined()
      }
    } else {
      expect(validateOutputs(outputs, false, ignoreLastAmount, ignoreLastAddress)).toBeTruthy()
    }
  })
})

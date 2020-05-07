import { verifyNetworkName } from 'utils/validators'
import { ErrorCode } from 'utils/enums'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { name, usedNames, expected }]) => [
  title,
  name,
  usedNames,
  expected,
])

describe(`Verify network name`, () => {
  test.each(fixtureTable)(
    `%s`,
    (_title: string, name: string, usedNames: string[], expected: boolean | { code: ErrorCode }) => {
      expect(verifyNetworkName(name, usedNames)).toEqual(expected)
    }
  )
})

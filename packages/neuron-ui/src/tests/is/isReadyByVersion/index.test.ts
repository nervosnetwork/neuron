import { isReadyByVersion } from 'utils/is'
import fixtures from './fixtures'

const fixtureTable: [string, Parameters<typeof isReadyByVersion>, boolean][] = Object.entries(
  fixtures
).map(([title, { params, expected }]) => [title, [params.targetVersion, params.lastVersion], expected])

describe('Test isReadyByVersion', () => {
  test.each(fixtureTable)(`%s`, (_title, [targetVersion, lastVersion], expected) => {
    expect.assertions(1)
    const actual = isReadyByVersion(targetVersion, lastVersion)
    expect(actual).toBe(expected)
  })
})

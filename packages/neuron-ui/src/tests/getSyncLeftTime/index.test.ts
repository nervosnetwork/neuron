import getSyncLeftTime from 'utils/getSyncLeftTime'
import fixtures from './fixtures.json'

describe('Test getCompensatedTime', () => {
  const fixtureTable: [string, number | null, string][] = Object.entries(
    fixtures
  ).map(([title, { estimate, expected }]) => [title, estimate, expected])

  test.each(fixtureTable)(`%s`, (_title, estimate, expected) => {
    expect.assertions(1)
    expect(getSyncLeftTime(estimate ?? undefined)).toBe(expected)
  })
})

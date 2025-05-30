import { describe, test, expect } from 'vitest'
import { isMainnet } from 'utils/is'
import fixtures from './fixtures'

const fixtureTable: [string, Parameters<typeof isMainnet>, boolean][] = Object.entries(fixtures).map(
  ([title, { params, expected }]) => [title, [params.networks, params.networkID], expected]
)

describe('Test isMainnet', () => {
  test.each(fixtureTable)(`%s`, (_title, [networks, networkID], expected) => {
    expect.assertions(1)
    const actual = isMainnet(networks, networkID)
    expect(actual).toBe(expected)
  })
})

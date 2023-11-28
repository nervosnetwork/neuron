import { describe, test, expect } from '@jest/globals'
import { addressesToBalance } from 'utils/formatters'
import fixtures from './fixtures'

const fixtureTable: [string, any, string][] = Object.entries(fixtures).map(([title, { addresses, expected }]) => [
  title,
  addresses,
  expected,
])

describe(`Verify addresses to balance`, () => {
  test.each(fixtureTable)(`%s`, (_title: string, addresses: any, expected: string) => {
    expect(addressesToBalance(addresses)).toBe(expected)
  })
})

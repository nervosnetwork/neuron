import { addressesToBalance } from 'utils/formatters'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { addresses, expected }]) => [title, addresses, expected])

describe(`Verify addresses to balance`, () => {
  test.each(fixtureTable)(`%s`, (_title: string, addresses: any, expected: string) => {
    expect(addressesToBalance(addresses)).toBe(expected)
  })
})

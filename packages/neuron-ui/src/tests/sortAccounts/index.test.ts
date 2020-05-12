import sortAccounts, { Account } from 'utils/sortAccounts'
import fixtures from './fixtures.json'

describe('Test sortAccounts', () => {
  const fixtureTable: [string, { accounts: Account[]; expected: Account[] }][] = Object.entries(
    fixtures
  ).map(([name, fixture]) => [name, fixture])

  test.each(fixtureTable)('%s', (_name: string, { accounts, expected }: any) => {
    const actual = accounts.sort(sortAccounts)
    expect(actual).toEqual(expected)
  })
})

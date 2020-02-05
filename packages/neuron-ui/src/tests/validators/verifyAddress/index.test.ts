import { verifyAddress } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { address, expected }]) => [title, address, expected])

describe(`Verify address`, () => {
  test.each(fixtureTable)(`%s`, (_title: string, amount: string, expected: boolean) => {
    expect(verifyAddress(amount, true)).toEqual(expected)
  })
})

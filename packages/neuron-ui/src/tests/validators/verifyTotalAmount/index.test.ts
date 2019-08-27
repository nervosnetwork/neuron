import { verifyTotalAmount } from 'utils/validators'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { totalAmount, fee, balance, expected }]) => [
  title,
  totalAmount,
  fee,
  balance,
  expected,
])

describe('Verify total amount', () => {
  test.each(fixtureTable)(
    `%s`,
    (_title: string, totalAmount: string, fee: string, balance: string, expected: boolean) => {
      expect(verifyTotalAmount(totalAmount, fee, balance)).toBe(expected)
    }
  )
})

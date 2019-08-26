import { verifyTransactionOutputs } from '../../../utils/validators'
import fixtures from './fixture'

const fixtureTable = Object.entries(fixtures).map(([title, { outputs, expected }]) => [title, outputs, expected])

describe(`test verify transaction outputs`, () => {
  test.each(fixtureTable)(
    `%s, outputs: %j, expected: %s`,
    (_title: string, outputs: { address: string; amount: string }[], expected: boolean) => {
      expect(verifyTransactionOutputs(outputs)).toBe(expected)
    }
  )
})

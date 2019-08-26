import { verifyTransactionOutputs } from '../../../utils/validators'
import fixtures from './fixture'

describe('test verify transaction outputs', () => {
  const fixtureTable = Object.entries(fixtures).map(([title, { outputs, expected }]) => [title, outputs, expected])
  test.each(fixtureTable)('%s, outputs: %j, expected: %s', (title, outputs, expected) => {
    expect(verifyTransactionOutputs(outputs)).toBe(expected)
  })
})
